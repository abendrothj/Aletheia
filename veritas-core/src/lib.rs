use wasm_bindgen::prelude::*;
use c2pa::Reader;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Cursor;

#[derive(Serialize, Deserialize)]
pub struct VerificationResult {
    status: String,  // "valid", "invalid", "expired", "none", "error"
    claims: Option<Claims>,
    history: Vec<HistoryEvent>,
    thumbnail: Option<String>,  // Base64 encoded
    raw_manifest: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Claims {
    creator: Option<String>,
    tool: Option<String>,
    date: Option<String>,
    title: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct HistoryEvent {
    action: String,
    tool: String,
    timestamp: String,
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn verify_c2pa(image_data: &[u8], mime_type: &str) -> String {
    let mut cursor = Cursor::new(image_data);

    match Reader::from_stream(mime_type, &mut cursor) {
        Ok(reader) => {
            // Extract manifest store as JSON
            match reader.json() {
                Ok(manifest_json) => {
                    // Parse the manifest to extract structured data
                    let result = parse_manifest(&manifest_json);
                    serde_json::to_string(&result).unwrap_or_else(|_|
                        r#"{"status":"error","claims":null,"history":[],"thumbnail":null,"raw_manifest":null}"#.to_string()
                    )
                },
                Err(e) => {
                    // Error extracting manifest
                    let error_msg = format!("Manifest extraction error: {}", e);
                    serde_json::to_string(&VerificationResult {
                        status: "error".to_string(),
                        claims: None,
                        history: vec![],
                        thumbnail: None,
                        raw_manifest: Some(error_msg),
                    }).unwrap_or_else(|_|
                        r#"{"status":"error","claims":null,"history":[],"thumbnail":null,"raw_manifest":null}"#.to_string()
                    )
                }
            }
        },
        Err(_) => {
            // No C2PA data found
            r#"{"status":"none","claims":null,"history":[],"thumbnail":null,"raw_manifest":null}"#.to_string()
        }
    }
}

fn parse_manifest(manifest_json: &str) -> VerificationResult {
    // Parse the JSON manifest
    let manifest: Value = match serde_json::from_str(manifest_json) {
        Ok(v) => v,
        Err(_) => {
            return VerificationResult {
                status: "error".to_string(),
                claims: None,
                history: vec![],
                thumbnail: None,
                raw_manifest: Some(manifest_json.to_string()),
            }
        }
    };

    // Extract active manifest (the most recent one)
    let active_manifest = manifest.get("active_manifest")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let manifests = manifest.get("manifests").and_then(|v| v.as_object());

    let active = manifests
        .and_then(|m| m.get(active_manifest))
        .unwrap_or(&manifest);

    // Determine validation status
    let status = determine_status(active);

    // Extract claims
    let claims = extract_claims(active);

    // Extract history/actions
    let history = extract_history(active);

    // Extract thumbnail
    let thumbnail = extract_thumbnail(active);

    VerificationResult {
        status,
        claims,
        history,
        thumbnail,
        raw_manifest: Some(manifest_json.to_string()),
    }
}

fn determine_status(manifest: &Value) -> String {
    // Check validation status
    if let Some(validation_status) = manifest.get("validation_status") {
        if let Some(status_arr) = validation_status.as_array() {
            // If any validation failed, mark as invalid
            for status_item in status_arr {
                if let Some(code) = status_item.get("code").and_then(|v| v.as_str()) {
                    if code.contains("signingCredential.expired") || code.contains("expired") {
                        return "expired".to_string();
                    }
                    if code.contains("invalid") || code.contains("failed") {
                        return "invalid".to_string();
                    }
                }
            }
        }
    }

    // Check signature info
    if let Some(signature_info) = manifest.get("signature_info") {
        if let Some(sig_val) = signature_info.get("validated") {
            if sig_val.as_bool() == Some(false) {
                return "invalid".to_string();
            }
        }
    }

    // If we have a claim, it's valid
    if manifest.get("claim_generator").is_some() || manifest.get("assertions").is_some() {
        return "valid".to_string();
    }

    "none".to_string()
}

fn extract_claims(manifest: &Value) -> Option<Claims> {
    let mut creator: Option<String> = None;
    let mut tool: Option<String> = None;
    let mut date: Option<String> = None;
    let mut title: Option<String> = None;

    // Extract from claim_generator
    if let Some(claim_gen) = manifest.get("claim_generator") {
        tool = claim_gen.as_str().map(|s| s.to_string());
    }

    // Extract from claim_generator_info (more detailed)
    if let Some(claim_gen_info) = manifest.get("claim_generator_info") {
        if let Some(name) = claim_gen_info.get("name") {
            tool = name.as_str().map(|s| s.to_string());
        }
        if let Some(version) = claim_gen_info.get("version") {
            if let Some(t) = &tool {
                tool = Some(format!("{} {}", t, version.as_str().unwrap_or("")));
            }
        }
    }

    // Extract creator from assertions
    if let Some(assertions) = manifest.get("assertions") {
        if let Some(assertions_arr) = assertions.as_array() {
            for assertion in assertions_arr {
                // Check for creator assertion (stds.schema-org.CreativeWork)
                if let Some(label) = assertion.get("label").and_then(|v| v.as_str()) {
                    if label.contains("creativeWork") || label.contains("creator") {
                        if let Some(data) = assertion.get("data") {
                            if let Some(author) = data.get("author") {
                                if let Some(author_arr) = author.as_array() {
                                    if let Some(first_author) = author_arr.first() {
                                        creator = first_author.get("name")
                                            .and_then(|v| v.as_str())
                                            .map(|s| s.to_string());
                                    }
                                } else if let Some(name) = author.get("name") {
                                    creator = name.as_str().map(|s| s.to_string());
                                }
                            }
                        }
                    }

                    // Extract title
                    if label.contains("creativeWork") {
                        if let Some(data) = assertion.get("data") {
                            if let Some(t) = data.get("name").and_then(|v| v.as_str()) {
                                title = Some(t.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // Extract date from claim metadata
    if let Some(metadata) = manifest.get("metadata") {
        if let Some(date_str) = metadata.get("dateTime") {
            date = date_str.as_str().map(|s| s.to_string());
        }
    }

    // Fallback to signature date
    if date.is_none() {
        if let Some(signature_info) = manifest.get("signature_info") {
            if let Some(time) = signature_info.get("time") {
                date = time.as_str().map(|s| s.to_string());
            }
        }
    }

    // Only return claims if we found at least something
    if creator.is_some() || tool.is_some() || date.is_some() || title.is_some() {
        Some(Claims {
            creator,
            tool,
            date,
            title,
        })
    } else {
        None
    }
}

fn extract_history(manifest: &Value) -> Vec<HistoryEvent> {
    let mut events = Vec::new();

    // Extract from assertions (actions)
    if let Some(assertions) = manifest.get("assertions") {
        if let Some(assertions_arr) = assertions.as_array() {
            for assertion in assertions_arr {
                if let Some(label) = assertion.get("label").and_then(|v| v.as_str()) {
                    // Look for action assertions (c2pa.actions)
                    if label.contains("actions") || label.contains("c2pa.actions") {
                        if let Some(data) = assertion.get("data") {
                            if let Some(actions) = data.get("actions").and_then(|v| v.as_array()) {
                                for action in actions {
                                    let action_type = action.get("action")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("unknown")
                                        .to_string();

                                    let software = action.get("softwareAgent")
                                        .and_then(|v| v.as_str())
                                        .or_else(|| action.get("digitalSourceType").and_then(|v| v.as_str()))
                                        .unwrap_or("Unknown")
                                        .to_string();

                                    let when = action.get("when")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("")
                                        .to_string();

                                    events.push(HistoryEvent {
                                        action: action_type,
                                        tool: software,
                                        timestamp: when,
                                    });
                                }
                            } else if let Some(action_obj) = data.as_object() {
                                // Single action object
                                let action_type = action_obj.get("action")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("unknown")
                                    .to_string();

                                let software = action_obj.get("softwareAgent")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("Unknown")
                                    .to_string();

                                let when = action_obj.get("when")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("")
                                    .to_string();

                                events.push(HistoryEvent {
                                    action: action_type,
                                    tool: software,
                                    timestamp: when,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // If no actions found, create a single event from claim_generator
    if events.is_empty() {
        if let Some(claim_gen) = manifest.get("claim_generator").and_then(|v| v.as_str()) {
            let timestamp = manifest.get("metadata")
                .and_then(|m| m.get("dateTime"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            events.push(HistoryEvent {
                action: "created".to_string(),
                tool: claim_gen.to_string(),
                timestamp,
            });
        }
    }

    events
}

fn extract_thumbnail(manifest: &Value) -> Option<String> {
    // Look for thumbnail in assertions
    if let Some(assertions) = manifest.get("assertions") {
        if let Some(assertions_arr) = assertions.as_array() {
            for assertion in assertions_arr {
                if let Some(label) = assertion.get("label").and_then(|v| v.as_str()) {
                    // Look for thumbnail assertion
                    if label.contains("thumbnail") || label.contains("c2pa.thumbnail") {
                        // Thumbnail data might be in 'data' field as base64 or URL
                        if let Some(data) = assertion.get("data") {
                            if let Some(identifier) = data.get("identifier") {
                                // It's a reference to another resource
                                // For now, we'll skip this complex case
                                continue;
                            }

                            // Check if data itself is the base64 string
                            if let Some(base64_str) = data.as_str() {
                                return Some(base64_str.to_string());
                            }
                        }

                        // Check for inline data URL
                        if let Some(url) = assertion.get("url").and_then(|v| v.as_str()) {
                            if url.starts_with("data:image") {
                                // Extract base64 part from data URL
                                if let Some(base64_part) = url.split(',').nth(1) {
                                    return Some(base64_part.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    None
}
