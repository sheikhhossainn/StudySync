// OCR.js - Optical Character Recognition module for document processing

class OCRProcessor {
    constructor() {
        this.apiKey = null; // In production, use environment variables
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Main OCR processing function
     * @param {File} file - Image file to process
     * @param {string} documentType - Type of document (studentId, nid, companyId)
     * @returns {Promise<Object>} Extracted data from the document
     */
    async processDocument(file, documentType) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Preprocess image
            const processedImage = await this.preprocessImage(file);
            
            // Perform OCR
            const ocrResult = await this.performOCR(processedImage);
            
            // Parse results based on document type
            const extractedData = this.parseDocumentData(ocrResult, documentType);
            
            // Validate extracted data
            const validatedData = this.validateExtractedData(extractedData, documentType);
            
            return validatedData;
            
        } catch (error) {
            console.error('OCR processing failed:', error);
            throw new Error(`Failed to process ${documentType}: ${error.message}`);
        }
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (!this.supportedFormats.includes(file.type)) {
            throw new Error('Unsupported file format. Please upload JPG or PNG files.');
        }

        if (file.size > this.maxFileSize) {
            throw new Error('File size too large. Please upload files smaller than 5MB.');
        }
    }

    /**
     * Preprocess image for better OCR results
     * @param {File} file - Original image file
     * @returns {Promise<File>} Processed image file
     */
    async preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Set canvas dimensions
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Apply image enhancements
                    this.enhanceImage(ctx, canvas.width, canvas.height);

                    // Convert back to blob
                    canvas.toBlob((blob) => {
                        const processedFile = new File([blob], file.name, { type: file.type });
                        resolve(processedFile);
                    }, file.type, 0.9);

                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Enhance image for better OCR recognition
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Image width
     * @param {number} height - Image height
     */
    enhanceImage(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Apply contrast and brightness adjustments
        for (let i = 0; i < data.length; i += 4) {
            // Increase contrast
            const contrast = 1.2;
            const brightness = 10;

            data[i] = Math.min(255, Math.max(0, data[i] * contrast + brightness));     // Red
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrast + brightness)); // Green
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrast + brightness)); // Blue
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Perform OCR using Tesseract.js or cloud service
     * @param {File} file - Processed image file
     * @returns {Promise<string>} Raw OCR text
     */
    async performOCR(file) {
        // In production, you would use one of these options:
        
        // Option 1: Tesseract.js (client-side)
        // return await this.performTesseractOCR(file);
        
        // Option 2: Google Cloud Vision API
        // return await this.performGoogleVisionOCR(file);
        
        // Option 3: AWS Textract
        // return await this.performAWSTextractOCR(file);
        
        // Option 4: Azure Computer Vision
        // return await this.performAzureOCR(file);

        // For demo purposes, simulate OCR with random realistic data
        return this.simulateOCR(file);
    }

    /**
     * Simulate OCR processing for demo purposes
     * @param {File} file - Image file
     * @returns {Promise<string>} Simulated OCR text
     */
    async simulateOCR(file) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Return simulated OCR text based on file name or random
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('student') || fileName.includes('id')) {
            return `
                STUDENT IDENTIFICATION CARD
                University of Technology Bangladesh
                
                Name: JOHN ALEXANDER DOE
                Student ID: 2021-15-012345
                Department: Computer Science
                Session: 2021-2025
                
                Valid Until: December 2025
            `;
        } else if (fileName.includes('nid') || fileName.includes('national')) {
            return `
                PEOPLE'S REPUBLIC OF BANGLADESH
                NATIONAL IDENTITY CARD
                
                Name: JOHN ALEXANDER DOE
                Father: ROBERT DOE
                Mother: JANE DOE
                Date of Birth: 15 JAN 1995
                NID No: 1234567890123
                
                Blood Group: B+
            `;
        } else if (fileName.includes('company') || fileName.includes('office')) {
            return `
                TECH SOLUTIONS INC.
                EMPLOYEE IDENTIFICATION
                
                Name: JOHN ALEXANDER DOE
                Employee ID: EMP-2023-001
                Department: Software Development
                Designation: Senior Developer
                Join Date: 15 MAR 2020
                
                Valid Until: 31 DEC 2024
            `;
        }

        // Default student ID simulation
        return `
            STUDENT IDENTIFICATION CARD
            University of Technology Bangladesh
            
            Name: JOHN ALEXANDER DOE
            Student ID: 2021-15-012345
            Department: Computer Science
            Session: 2021-2025
        `;
    }

    /**
     * Client-side OCR using Tesseract.js
     * @param {File} file - Image file
     * @returns {Promise<string>} OCR text
     */
    async performTesseractOCR(file) {
        // Note: You would need to include Tesseract.js library
        // <script src='https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js'></script>
        
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js library not loaded');
        }

        const { data: { text } } = await Tesseract.recognize(
            file,
            'eng+ben', // English and Bengali
            {
                logger: m => console.log(m) // Optional: show progress
            }
        );

        return text;
    }

    /**
     * Parse OCR text based on document type
     * @param {string} ocrText - Raw OCR text
     * @param {string} documentType - Type of document
     * @returns {Object} Structured data
     */
    parseDocumentData(ocrText, documentType) {
        const text = ocrText.toUpperCase();
        const extractedData = {};

        // Common patterns for name extraction
        const namePatterns = [
            /NAME[:\s]+([A-Z\s]+?)(?:\n|FATHER|MOTHER|ID|STUDENT|EMPLOYEE)/,
            /^([A-Z\s]+?)(?:\n|FATHER|MOTHER|ID|STUDENT|EMPLOYEE)/m
        ];

        // Extract name
        for (const pattern of namePatterns) {
            const nameMatch = text.match(pattern);
            if (nameMatch && nameMatch[1]) {
                const fullName = nameMatch[1].trim();
                const nameParts = fullName.split(/\s+/);
                extractedData.firstName = nameParts[0] || '';
                extractedData.lastName = nameParts.slice(1).join(' ') || '';
                break;
            }
        }

        // Parse based on document type
        switch (documentType) {
            case 'studentId':
                this.parseStudentId(text, extractedData);
                break;
            case 'nid':
                this.parseNationalId(text, extractedData);
                break;
            case 'companyId':
                this.parseCompanyId(text, extractedData);
                break;
        }

        return extractedData;
    }

    /**
     * Parse student ID specific information
     * @param {string} text - OCR text
     * @param {Object} extractedData - Data object to populate
     */
    parseStudentId(text, extractedData) {
        // Student ID patterns
        const studentIdPattern = /(?:STUDENT\s*ID|ID\s*NO?)[:\s]*([0-9-]+)/;
        const institutionPattern = /(?:UNIVERSITY|COLLEGE|INSTITUTE)[^0-9\n]*([A-Z\s]+?)(?:\n|DEPARTMENT)/;
        const departmentPattern = /DEPARTMENT[:\s]*([A-Z\s]+?)(?:\n|SESSION|VALID)/;
        const sessionPattern = /SESSION[:\s]*([0-9-]+)/;

        const studentIdMatch = text.match(studentIdPattern);
        if (studentIdMatch) {
            extractedData.idNumber = studentIdMatch[1].trim();
        }

        const institutionMatch = text.match(institutionPattern);
        if (institutionMatch) {
            extractedData.institution = this.cleanText(institutionMatch[1]);
        }

        const departmentMatch = text.match(departmentPattern);
        if (departmentMatch) {
            extractedData.department = this.cleanText(departmentMatch[1]);
        }

        const sessionMatch = text.match(sessionPattern);
        if (sessionMatch) {
            extractedData.session = sessionMatch[1].trim();
        }
    }

    /**
     * Parse national ID specific information
     * @param {string} text - OCR text
     * @param {Object} extractedData - Data object to populate
     */
    parseNationalId(text, extractedData) {
        // NID patterns
        const nidPattern = /(?:NID\s*NO?|NATIONAL\s*ID)[:\s]*([0-9]+)/;
        const dobPattern = /(?:DATE\s*OF\s*BIRTH|DOB)[:\s]*([0-9]+\s*[A-Z]+\s*[0-9]+)/;
        const fatherPattern = /FATHER[:\s]*([A-Z\s]+?)(?:\n|MOTHER)/;
        const motherPattern = /MOTHER[:\s]*([A-Z\s]+?)(?:\n|DATE|BLOOD)/;
        const bloodGroupPattern = /BLOOD\s*GROUP[:\s]*([ABO+\-]+)/;

        const nidMatch = text.match(nidPattern);
        if (nidMatch) {
            extractedData.idNumber = nidMatch[1].trim();
        }

        const dobMatch = text.match(dobPattern);
        if (dobMatch) {
            extractedData.dateOfBirth = dobMatch[1].trim();
        }

        const fatherMatch = text.match(fatherPattern);
        if (fatherMatch) {
            extractedData.fatherName = this.cleanText(fatherMatch[1]);
        }

        const motherMatch = text.match(motherPattern);
        if (motherMatch) {
            extractedData.motherName = this.cleanText(motherMatch[1]);
        }

        const bloodMatch = text.match(bloodGroupPattern);
        if (bloodMatch) {
            extractedData.bloodGroup = bloodMatch[1].trim();
        }
    }

    /**
     * Parse company ID specific information
     * @param {string} text - OCR text
     * @param {Object} extractedData - Data object to populate
     */
    parseCompanyId(text, extractedData) {
        // Company ID patterns
        const employeeIdPattern = /(?:EMPLOYEE\s*ID|EMP)[:\s]*([A-Z0-9-]+)/;
        const companyPattern = /^([A-Z\s&.]+?)(?:\n|EMPLOYEE|IDENTIFICATION)/m;
        const departmentPattern = /DEPARTMENT[:\s]*([A-Z\s]+?)(?:\n|DESIGNATION|VALID)/;
        const designationPattern = /DESIGNATION[:\s]*([A-Z\s]+?)(?:\n|JOIN|VALID)/;
        const joinDatePattern = /JOIN\s*DATE[:\s]*([0-9]+\s*[A-Z]+\s*[0-9]+)/;

        const empIdMatch = text.match(employeeIdPattern);
        if (empIdMatch) {
            extractedData.idNumber = empIdMatch[1].trim();
        }

        const companyMatch = text.match(companyPattern);
        if (companyMatch) {
            extractedData.company = this.cleanText(companyMatch[1]);
        }

        const deptMatch = text.match(departmentPattern);
        if (deptMatch) {
            extractedData.department = this.cleanText(deptMatch[1]);
        }

        const designationMatch = text.match(designationPattern);
        if (designationMatch) {
            extractedData.designation = this.cleanText(designationMatch[1]);
        }

        const joinMatch = text.match(joinDatePattern);
        if (joinMatch) {
            extractedData.joinDate = joinMatch[1].trim();
        }
    }

    /**
     * Clean extracted text
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s&.-]/g, '')
            .trim();
    }

    /**
     * Validate extracted data
     * @param {Object} data - Extracted data
     * @param {string} documentType - Document type
     * @returns {Object} Validated data
     */
    validateExtractedData(data, documentType) {
        const validated = { ...data };

        // Ensure minimum required fields
        if (!validated.firstName || validated.firstName.length < 2) {
            throw new Error('Could not extract valid name from document');
        }

        if (!validated.idNumber || validated.idNumber.length < 5) {
            throw new Error('Could not extract valid ID number from document');
        }

        // Document-specific validations
        switch (documentType) {
            case 'studentId':
                if (!validated.institution) {
                    console.warn('Institution name not found in student ID');
                }
                break;
            case 'nid':
                if (validated.idNumber && !/^[0-9]{10,17}$/.test(validated.idNumber.replace(/\s/g, ''))) {
                    console.warn('NID number format may be invalid');
                }
                break;
            case 'companyId':
                if (!validated.company) {
                    console.warn('Company name not found in company ID');
                }
                break;
        }

        return validated;
    }

    /**
     * Get confidence score for OCR result
     * @param {Object} data - Extracted data
     * @param {string} documentType - Document type
     * @returns {number} Confidence score (0-1)
     */
    getConfidenceScore(data, documentType) {
        let score = 0;
        let maxScore = 0;

        // Check for presence of required fields
        const requiredFields = ['firstName', 'idNumber'];
        const optionalFields = this.getOptionalFields(documentType);

        requiredFields.forEach(field => {
            maxScore += 0.3;
            if (data[field] && data[field].length > 1) {
                score += 0.3;
            }
        });

        optionalFields.forEach(field => {
            maxScore += 0.1;
            if (data[field] && data[field].length > 1) {
                score += 0.1;
            }
        });

        return maxScore > 0 ? score / maxScore : 0;
    }

    /**
     * Get optional fields for document type
     * @param {string} documentType - Document type
     * @returns {Array} Array of optional field names
     */
    getOptionalFields(documentType) {
        switch (documentType) {
            case 'studentId':
                return ['institution', 'department', 'session'];
            case 'nid':
                return ['dateOfBirth', 'fatherName', 'motherName', 'bloodGroup'];
            case 'companyId':
                return ['company', 'department', 'designation', 'joinDate'];
            default:
                return [];
        }
    }
}

// Export for use in auth.js
window.OCRProcessor = OCRProcessor;
