# Resume Text Extractor

A Next.js web application that allows users to upload PDF resumes and extract text content instantly. Perfect for parsing resumes, analyzing content, or converting PDFs to text format.

## Features

- **Drag & Drop Upload**: Easy-to-use interface for uploading PDF files
- **PDF Text Extraction**: Extracts text content from PDF resumes using pdf-parse
- **File Validation**: Validates file type (PDF only) and size (max 10MB)
- **Text Display**: Shows extracted text in a readable format
- **Copy to Clipboard**: One-click copy functionality for extracted text
- **Download as TXT**: Download extracted text as a .txt file
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd resumeparser
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the project root and add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-...
```

Notes:
- Do not surround the key with quotes and avoid trailing spaces. If you copied from a password manager, ensure no hidden whitespace is appended.
- After creating or changing `.env.local`, restart the dev server so environment variables are reloaded.

4. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload a Resume**: 
   - Drag and drop a PDF file onto the upload area, or
   - Click the upload area to select a file from your computer

2. **View Extracted Text**: 
   - The application will automatically extract and display the text content
   - View the character count and number of pages processed

3. **Copy or Download**: 
   - Use the "Copy to Clipboard" button to copy the text
   - Use the "Download as TXT" button to save the text as a file

## Supported File Types

- **PDF files only** (application/pdf)
- **Maximum file size**: 10MB
- **Text-based PDFs**: Works best with PDFs that contain selectable text

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **PDF Processing**: pdf-parse library
- **File Upload**: react-dropzone

## API Endpoints

### POST /api/extract-text

Extracts text from an uploaded PDF file.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with 'resume' field containing the PDF file

**Response:**
```json
{
  "text": "Extracted text content...",
  "pages": 2,
  "info": {
    "Title": "Resume Title",
    "Author": "Author Name",
    // ... other PDF metadata
  }
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## Development

### Project Structure

```
resumeparser/
├── app/
│   ├── api/
│   │   └── extract-text/
│   │       └── route.ts          # PDF text extraction API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   └── ResumeUploader.tsx        # Main upload component
├── public/                       # Static assets
├── package.json
└── README.md
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

1. **"Failed to extract text from PDF"**
   - Ensure the PDF contains selectable text (not scanned images)
   - Check that the file is a valid PDF
   - Try with a different PDF file

2. **File upload fails**
   - Check file size (must be under 10MB)
   - Ensure file is in PDF format
   - Check browser console for detailed error messages

3. **Application won't start**
   - Ensure all dependencies are installed (`npm install`)
   - Check Node.js version (18+ required)
   - Check if port 3000 is available

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Check the terminal/console running the dev server
3. Ensure all dependencies are properly installed
4. Try clearing browser cache and restarting the development server
