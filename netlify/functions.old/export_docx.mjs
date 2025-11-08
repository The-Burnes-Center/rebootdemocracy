import htmlToDocx from 'html-to-docx';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { html, fileName } = JSON.parse(event.body || '{}');
    if (!html || typeof html !== 'string') {
      return { statusCode: 400, body: 'Missing html' };
    }

    const buffer = await htmlToDocx(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${(fileName || 'reboot-answer').replace(/[^a-z0-9-_\.]/gi,'_')}.docx"`,
        'Cache-Control': 'no-cache'
      },
      // send raw binary; some dev servers proxy properly
      body: Buffer.from(buffer)
    };
  } catch (e) {
    console.error('export_docx error', e);
    return { statusCode: 500, body: 'Failed to export docx' };
  }
}


