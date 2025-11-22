import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export class SheetsService {
  private static sheets() {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth });
  }

  static async createOrUpdateWeeklySheet(title: string, rows: (string | number)[][]): Promise<string> {
    const sheets = this.sheets();
    const create = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [{ properties: { title: 'Weekly Report' } }],
      },
    });

    const spreadsheetId = create.data.spreadsheetId as string;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Weekly Report!A1',
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
}


