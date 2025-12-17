/**
 * Document Service
 * Handles document CRUD operations with Firebase
 */

import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebaseConfig';
import { Document, DocumentFileType, UserRole } from '../types';

/**
 * Detect file type from file name
 */
export function detectFileType(fileName: string): DocumentFileType {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    switch (ext) {
        case 'pdf':
            return 'PDF';
        case 'doc':
            return 'DOC';
        case 'docx':
            return 'DOCX';
        case 'txt':
            return 'TXT';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
            return 'IMAGE';
        default:
            return 'PDF'; // Default to PDF
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a new document entry in Firebase
 * Note: File upload to Storage should be handled separately
 */
export async function createDocument(
    documentData: Omit<Document, 'id' | 'uploadedAt'>
): Promise<Document> {
    try {
        const documentsRef = ref(database, 'documents');
        const newDocRef = push(documentsRef);

        const document: Document = {
            ...documentData,
            id: newDocRef.key!,
            uploadedAt: new Date().toISOString(),
        };

        await set(newDocRef, document);
        console.log('✅ Document created:', document.id);
        return document;
    } catch (error) {
        console.error('❌ Error creating document:', error);
        throw error;
    }
}

/**
 * Get all documents for a user (based on their role)
 */
export async function getDocumentsForUser(
    userId: string,
    userRole: UserRole
): Promise<Document[]> {
    try {
        const documentsRef = ref(database, 'documents');
        const snapshot = await get(documentsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const documents: Document[] = [];
        snapshot.forEach((child) => {
            const doc = child.val() as Document;

            if (userRole === UserRole.LAWYER) {
                // Lawyers see all documents where they are the lawyer
                if (doc.lawyerId === userId) {
                    documents.push(doc);
                }
            } else {
                // Clients see only documents shared with them
                if (doc.clientId === userId && doc.sharedWithClient) {
                    documents.push(doc);
                }
            }
        });

        // Sort by upload date (newest first)
        documents.sort((a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        console.log(`✅ Loaded ${documents.length} documents for user ${userId}`);
        return documents;
    } catch (error) {
        console.error('❌ Error loading documents:', error);
        throw error;
    }
}

/**
 * Get documents shared between a specific lawyer and client
 */
export async function getSharedDocuments(
    lawyerId: string,
    clientId: string
): Promise<Document[]> {
    try {
        const documentsRef = ref(database, 'documents');
        const snapshot = await get(documentsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const documents: Document[] = [];
        snapshot.forEach((child) => {
            const doc = child.val() as Document;
            if (doc.lawyerId === lawyerId && doc.clientId === clientId) {
                documents.push(doc);
            }
        });

        documents.sort((a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        return documents;
    } catch (error) {
        console.error('❌ Error loading shared documents:', error);
        throw error;
    }
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(documentId: string): Promise<Document | null> {
    try {
        const docRef = ref(database, `documents/${documentId}`);
        const snapshot = await get(docRef);

        if (!snapshot.exists()) {
            return null;
        }

        return snapshot.val() as Document;
    } catch (error) {
        console.error('❌ Error getting document:', error);
        throw error;
    }
}

/**
 * Update document fields
 */
export async function updateDocument(
    documentId: string,
    updates: Partial<Document>
): Promise<void> {
    try {
        const docRef = ref(database, `documents/${documentId}`);
        await update(docRef, updates);
        console.log('✅ Document updated:', documentId);
    } catch (error) {
        console.error('❌ Error updating document:', error);
        throw error;
    }
}

/**
 * Toggle document sharing with client
 */
export async function toggleDocumentSharing(
    documentId: string,
    shared: boolean
): Promise<void> {
    await updateDocument(documentId, { sharedWithClient: shared });
    console.log(`✅ Document ${documentId} sharing set to ${shared}`);
}

/**
 * Cache AI summary for a document
 */
export async function saveDocumentSummary(
    documentId: string,
    summary: string
): Promise<void> {
    await updateDocument(documentId, { aiSummary: summary });
}

/**
 * Save lawyer's private note on a document
 */
export async function saveDocumentNote(
    documentId: string,
    note: string
): Promise<void> {
    await updateDocument(documentId, { 
        lawyerNote: note,
        lawyerNoteUpdatedAt: new Date().toISOString()
    });
    console.log(`✅ Note saved for document ${documentId}`);
}

/**
 * Delete a document (Lawyer only)
 */
export async function deleteDocument(documentId: string): Promise<void> {
    try {
        const docRef = ref(database, `documents/${documentId}`);
        await remove(docRef);
        console.log('✅ Document deleted:', documentId);
    } catch (error) {
        console.error('❌ Error deleting document:', error);
        throw error;
    }
}

/**
 * Get documents linked to a specific appointment
 */
export async function getDocumentsByAppointment(
    appointmentId: string
): Promise<Document[]> {
    try {
        const documentsRef = ref(database, 'documents');
        const snapshot = await get(documentsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const documents: Document[] = [];
        snapshot.forEach((child) => {
            const doc = child.val() as Document;
            if (doc.appointmentId === appointmentId) {
                documents.push(doc);
            }
        });

        return documents;
    } catch (error) {
        console.error('❌ Error loading documents by appointment:', error);
        throw error;
    }
}

/**
 * Count documents for a user (for dashboard display)
 */
export async function countDocumentsForUser(
    userId: string,
    userRole: UserRole
): Promise<number> {
    const documents = await getDocumentsForUser(userId, userRole);
    return documents.length;
}
