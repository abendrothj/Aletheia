use wasm_bindgen::prelude::*;
use c2pa::Reader;
use serde::{Deserialize, Serialize};
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
                Err(_) => {
                    r#"{"status":"error","claims":null,"history":[],"thumbnail":null,"raw_manifest":null}"#.to_string()
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
    // Parse the JSON manifest and extract structured data
    // In a real implementation, you would:
    // 1. Check validation_status for signature validity
    // 2. Extract creator from c2pa.claim_generator
    // 3. Parse c2pa.actions array for history
    // 4. Extract thumbnail from c2pa.thumbnail

    // For now, return a stub that shows the structure
    // TODO: Implement full C2PA manifest parsing

    VerificationResult {
        status: "valid".to_string(),
        claims: Some(Claims {
            creator: Some("Unknown Creator".to_string()),
            tool: Some("Unknown Tool".to_string()),
            date: Some("2024-01-01T00:00:00Z".to_string()),
        }),
        history: vec![
            HistoryEvent {
                action: "created".to_string(),
                tool: "Camera".to_string(),
                timestamp: "2024-01-01T00:00:00Z".to_string(),
            }
        ],
        thumbnail: None,
        raw_manifest: Some(manifest_json.to_string()),
    }
}
