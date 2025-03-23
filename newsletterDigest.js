/**
 * Enhanced Newsletter Digest Creator
 * 
 * Creates a daily digest of Substack newsletters received in the last 24 hours,
 * with detailed summaries to minimize the need to read the originals.
 */

function createNewsletterDigest() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const searchCriteria = `after:${formatDateForGmail(twentyFourHoursAgo)} label:substack`;
  const threads = GmailApp.search(searchCriteria, 0, 50);

  if (threads.length === 0) {
    Logger.log('No newsletter emails found in the last 24 hours.');
    return;
  }

  let emailCount = 0;
  let newsletterData = [];

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();

    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      if (message.getDate() >= twentyFourHoursAgo) {
        emailCount++;
        const sender = extractSenderName(message.getFrom());
        const subject = cleanText(message.getSubject());
        const date = message.getDate();
        const bodyHtml = message.getBody();
        const { category, insights, newsContext, bottomLine } = extractImportantContent(bodyHtml, subject);

        const messageId = message.getId();
        const anchorId = `newsletter-${emailCount}`;
        newsletterData.push({
          subject,
          sender,
          date,
          category,
          insights,
          newsContext,
          bottomLine,
          messageId,
          anchorId,
        });
      }
    }
  }

  if (emailCount === 0) return;

  let digestContent = `<h1>Good morning, Henrik! ☕️</h1>
  <p>Here's your daily digest of ${emailCount} newsletter${emailCount === 1 ? '' : 's'} from the last 24 hours.</p>
  <div class="toc">
    <h2>Today's Highlights</h2>
    <ol>`;
  newsletterData.forEach((newsletter, index) => {
    digestContent += `<li><a href="#newsletter-${index + 1}">${newsletter.subject}</a> - ${newsletter.sender} (${newsletter.category})</li>`;
  });
  digestContent += `</ol></div>
  <div class="tldr" style="background-color: #f1f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h2 style="font-size: 20px; color: #2c3e50;">Actionable Nuggets</h2>
    <p>Here are three actionable nuggets from the newsletters that Henrik Werdelin will find fascinating:</p>
    <ul style="margin-left: 20px;">`;
  newsletterData.forEach((newsletter) => {
    digestContent += `<li><strong>${newsletter.subject}:</strong> ${newsletter.bottomLine}</li>`;
  });
  digestContent += `</ul></div>`;

  newsletterData.forEach((newsletter, index) => {
    digestContent += `<div class="newsletter-item" style="padding: 20px; border-bottom: 1px solid #ddd; margin-bottom: 20px;">
      <h2 id="newsletter-${index + 1}" style="font-size: 22px; color: #3498db; margin-bottom: 10px;">${newsletter.subject}</h2>
      <p style="color: #888; font-size: 13px; margin: 0;">${newsletter.sender} • ${formatDate(newsletter.date)}</p>
      <p style="font-weight: bold; color: #2c3e50; margin: 15px 0; font-size: 16px;">${newsletter.bottomLine}</p>
      <h3 style="font-size: 16px; color: #555; margin: 15px 0 5px;">Key Points:</h3>
      <ul style="margin: 0 0 15px 20px; font-size: 14px; line-height: 1.6;">${newsletter.insights.map(insight => `<li>${insight}</li>`).join('')}</ul>
      ${newsletter.category === 'News' && newsletter.newsContext ? `
        <div class="news-context" style="background-color: #fff3e6; padding: 10px; border-left: 4px solid #ff9800; margin-bottom: 15px;">
          <strong>News Context:</strong> ${newsletter.newsContext}
        </div>` : ''}
      <a href="https://mail.google.com/mail/u/0/#inbox/${newsletter.messageId}" style="color: #3498db; font-size: 13px;">Read Full →</a>
    </div>`;
  });

  const userEmail = Session.getActiveUser().getEmail();
  const digestSubject = `Newsletter Digest: ${emailCount} newsletter${emailCount === 1 ? '' : 's'} from the last 24 hours`;

  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6; }
          h1 { color: #2c3e50; font-size: 28px; margin-bottom: 10px; }
          h2 { color: #3498db; margin-top: 25px; font-size: 22px; }
          h3 { font-size: 16px; color: #555; margin: 15px 0 5px; }
          hr { border: 0; height: 1px; background: #eee; margin: 25px 0; }
          ol, ul { padding-left: 20px; }
          li { margin-bottom: 10px; }
          .toc { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .tldr { background-color: #f1f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .newsletter-item { margin-bottom: 30px; }
          .news-context { background-color: #fff3e6; padding: 10px; border-left: 4px solid #ff9800; margin-bottom: 15px; }
          .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body id="top">
        ${digestContent}
        <p class="footer">
          This digest was automatically generated from your newsletters labeled 'substack'. 
          To unsubscribe, remove the trigger from the Google Apps Script project.
        </p>
      </body>
    </html>
  `;

  GmailApp.sendEmail(
    userEmail,
    digestSubject,
    "This digest is best viewed in HTML format.",
    { htmlBody: htmlBody }
  );

  Logger.log(`Digest email with ${emailCount} newsletters sent to ${userEmail}`);
}

/**
 * Formats a date object for Gmail search criteria
 * @param {Date} date The date to format
 * @return {string} Formatted date string (YYYY/MM/DD)
 */
function formatDateForGmail(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Format date in a more readable way
 * @param {Date} date The date to format
 * @return {string} Formatted date string
 */
function formatDate(date) {
  const options = { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Extract just the sender name from the full email string
 * @param {string} fromString The full sender string (e.g., "Name <email@example.com>")
 * @return {string} Just the sender name
 */
function extractSenderName(fromString) {
  const nameMatch = fromString.match(/^"?([^"<]+)"?\s*(?:<.*>)?$/);
  return nameMatch && nameMatch[1] ? nameMatch[1].trim() : fromString;
}

/**
 * Extract detailed content from email body using OpenAI
 * @param {string} html The email HTML content
 * @param {string} subject The email subject for context
 * @return {Object} Object containing category, insights, newsContext, bottomLine
 */
function extractImportantContent(html, subject) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  // Clean the subject to remove unwanted characters
  subject = cleanText(subject);

  let plainText = stripHtml(html);
  if (!plainText || plainText.length < 50) {
    return {
      category: "Unknown",
      insights: ["Content too short to summarize."],
      newsContext: null,
      bottomLine: "No key takeaway available.",
      imageUrl: null,
      readingTime: 1
    };
  }

  const prompt = `
You are an expert newsletter analyst tasked with creating a comprehensive yet concise summary of the following plain-text newsletter content (subject: "${subject}"):

"""
${plainText}
"""

Your task:
1) Categorize the newsletter as one of:
   - "News": Timely updates on recent events or developments.
   - "Analysis": In-depth insights or interpretations of topics.
   - "Opinion": Subjective perspectives or arguments.
2) Extract 4-6 essential takeaways or key news stories (if "News") as bullet points. Include specific details (e.g., names, numbers, examples) to make them standalone and informative.
3) If "News," provide a 2-3 sentence "News Context" summarizing the top story with key details (who, what, when, where, why).
4) Provide a "Bottom Line" of 1-2 sentences capturing the core message or actionable takeaway.

Return your response in this format:

Category: [News/Analysis/Opinion]

Essential Takeaways:
- Takeaway 1 with details
- Takeaway 2 with details
- Takeaway 3 with details
- Takeaway 4 with details

News Context (if News):
- 2-3 sentences about the top story.

Bottom Line:
- 1-2 sentences with the core message or takeaway.
`;

  const payload = {
    model: 'gpt-4.5-preview',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
    top_p: 1.0
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${apiKey}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const json = JSON.parse(response.getContentText());
    const aiContent = json.choices[0].message.content;

    const categoryMatch = aiContent.match(/Category:\s*(News|Analysis|Opinion)/i);
    const insightsMatch = aiContent.match(/Essential Takeaways:\n((?:- .+\n?)+)/i);
    const newsContextMatch = aiContent.match(/News Context \(if News\):\n?- ((?:.+\n?)+)/i);
    const bottomLineMatch = aiContent.match(/Bottom Line:\n?- ((?:.+\n?)+)/i);

    const category = categoryMatch ? categoryMatch[1].trim() : "Analysis";
    const insights = insightsMatch ? insightsMatch[1].trim().split('\n').map(i => i.replace(/^- /, '').trim()) : [];
    const newsContext = newsContextMatch ? newsContextMatch[1].trim() : null;
    const bottomLine = bottomLineMatch ? bottomLineMatch[1].trim() : "";

    return {
      category,
      insights,
      newsContext,
      bottomLine,
      imageUrl: null,
      readingTime: Math.max(1, Math.round(plainText.split(/\s+/).length / 200))
    };
  } catch (e) {
    Logger.log('OpenAI API error: ' + e.message);
    return {
      category: "Analysis",
      insights: ["Error summarizing content."],
      newsContext: null,
      bottomLine: "Unable to generate summary.",
      imageUrl: null,
      readingTime: 1
    };
  }
}

/**
 * Removes HTML tags and newsletter boilerplate to yield plain text
 */
function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(unsubscribe|view in browser|follow us|share this|click here|sponsor|advertisement|\bhttp\S+\b)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sets up a daily trigger to run the digest at 8 AM
 */
function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'createNewsletterDigest') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger('createNewsletterDigest')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log('Newsletter digest trigger set up to run at 8 AM daily');
}

/**
 * Manual trigger function for testing
 */
function runDigestNow() {
  createNewsletterDigest();
}

/**
 * Cleans text by removing unwanted characters
 * @param {string} text The text to clean
 * @return {string} Cleaned text
 */
function cleanText(text) {
  // Replace non-printable characters and unknown character symbols with an empty string
  return text.replace(/[\uFFFD\u0000-\u001F\u007F-\u009F]/g, '');
}
