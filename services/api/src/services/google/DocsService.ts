import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export class DocsService {
  private static docs() {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/documents'] });
    return google.docs({ version: 'v1', auth });
  }

  static async createWeeklyReportDoc(userId: string, title: string, bodyContent: string): Promise<string> {
    const docs = this.docs();
    const create = await docs.documents.create({ requestBody: { title } });
    const docId = create.data.documentId as string;

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              text: bodyContent,
              location: { index: 1 },
            },
          },
        ],
      },
    });

    return `https://docs.google.com/document/d/${docId}/edit`;
  }
}


