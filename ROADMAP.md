Flyer Parser MVP: Feature Roadmap
1. Basic File Upload

User can select image files from device
Drag and drop functionality works
Image preview shows selected file
File validation (size, type) with user feedback
Clean, mobile-friendly interface

2. Mock Parsing Pipeline

Upload triggers "parsing" with fake delay
Returns hardcoded structured event data
Shows loading state during processing
Demonstrates the full user flow without LLM dependency

3. Results Display Interface

Side-by-side view: original flyer + extracted data
Shows all parsed fields (title, date, time, location, description)
Confidence scores displayed as visual indicators (colors/percentages)
Clean, scannable layout for reviewing results

4. Real LLM Integration

Replace mock with actual Gemini API call
Convert image to base64 for API
Send structured prompt for event extraction
Parse LLM response into consistent data format

5. Error Handling & Edge Cases

Handle LLM API failures gracefully
Deal with low-confidence extractions
Manage rate limits and timeouts
Clear error messages for users

6. Basic State Management

Track parsing progress (idle → uploading → parsing → complete)
Allow users to start over with new flyer
Maintain session state during parsing

7. Confidence Threshold Logic

Flag fields with low confidence scores
Visual indicators for "uncertain" extractions
Maybe suggest manual review for low-confidence results

8. Mobile Optimization

Camera capture option (not just file upload)
Touch-friendly interface
Responsive layout for phone screens
Works well with phone photo uploads

9. Data Persistence (Optional)

Save parsed results to Firestore
Store original images in Firebase Storage
Basic history of parsed flyers

10. Manual Correction Interface (Future)

Edit parsed fields when AI gets it wrong
Save corrections to improve future parsing
Simple form overlay on results view
