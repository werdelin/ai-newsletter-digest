/**
 * Newsletter Digest Creator
 * This script searches for emails with the 'newsletter' label received in the last 12 hours,
 * extracts important content, and sends a digest email.
 */

function createNewsletterDigest() {
  // Get the current time and calculate 12 hours ago
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  
  // Format search criteria (received after time X AND has label 'newsletter')
  const searchCriteria = `after:${formatDateForGmail(twelveHoursAgo)} label:newsletter`;
  
  // Find the matching threads
  const threads = GmailApp.search(searchCriteria, 0, 50);
  
  if (threads.length === 0) {
    Logger.log('No newsletter emails found in the last 12 hours.');
    return;
  }
  
  // Process the emails and create digest content
  let digestContent = "";
  let emailCount = 0;
  let tableOfContents = "<h2>Newsletters in this Digest</h2><ol>";
  let newsletterData = [];
  
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    
    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      
      // Only process messages that are newer than 12 hours
      if (message.getDate() >= twelveHoursAgo) {
        emailCount++;
        
        // Extract sender, subject, and date
        const sender = message.getFrom();
        const subject = message.getSubject();
        const date = message.getDate();
        
        // Get email body and extract important content
        const body = message.getBody();
        const important = extractImportantContent(body);
        
        // Store newsletter info for table of contents
        const messageId = message.getId();
        const anchorId = `newsletter-${emailCount}`;
        newsletterData.push({
          subject: subject,
          sender: sender,
          date: date,
          content: important,
          messageId: messageId,
          anchorId: anchorId
        });
        
        // Add to table of contents
        tableOfContents += `<li><a href="#${anchorId}">${subject}</a> - ${sender.replace(/<.*>/, "").trim()}</li>`;
      }
    }
  }
  tableOfContents += "</ol><hr>";
  
  // Generate the digest content with anchors
  for (let i = 0; i < newsletterData.length; i++) {
    const newsletter = newsletterData[i];
    
    // Add to digest with anchor
    digestContent += `<h2 id="${newsletter.anchorId}">${newsletter.subject}</h2>`;
    digestContent += `<p><strong>From:</strong> ${newsletter.sender}</p>`;
    digestContent += `<p><strong>Received:</strong> ${newsletter.date.toLocaleString()}</p>`;
    digestContent += `<div>${newsletter.content}</div>`;
    digestContent += `<p><a href="https://mail.google.com/mail/u/0/#inbox/${newsletter.messageId}">View Original Email</a></p>`;
    digestContent += `<p><a href="#top">Back to Top</a></p>`;
    digestContent += `<hr>`;
  }
  
  // Send the digest if we found any emails
  if (emailCount > 0) {
    const userEmail = Session.getActiveUser().getEmail();
    const digestSubject = `Newsletter Digest: ${emailCount} newsletters from the last 12 hours`;
    
    // Create a nice HTML email
    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
            h1 { color: #2c3e50; }
            h2 { color: #3498db; margin-top: 20px; }
            hr { border: 0; height: 1px; background: #eee; margin: 20px 0; }
            ol { padding-left: 20px; }
            li { margin-bottom: 8px; }
            .toc { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body id="top">
          <h1>Your Newsletter Digest</h1>
          <p>Here's a summary of ${emailCount} newsletter${emailCount === 1 ? '' : 's'} from the last 12 hours.</p>
          <div class="toc">
            ${tableOfContents}
          </div>
          ${digestContent}
        </body>
      </html>
    `;
    
    GmailApp.sendEmail(
      userEmail,
      digestSubject,
      "This digest is better viewed in HTML format.",
      { htmlBody: htmlBody }
    );
    
    Logger.log(`Digest email with ${emailCount} newsletters sent to ${userEmail}`);
  }
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
 * Extract important content from email HTML
 * This function attempts to identify and extract meaningful content from newsletters
 * @param {string} html The email HTML content
 * @return {string} Extracted important content
 */
function extractImportantContent(html) {
  // Create a document from the HTML
  const doc = XmlService.parse(html);
  let content = "";
  
  try {
    // This is a simplified approach - in a real implementation, you would want more
    // sophisticated content extraction logic tailored to common newsletter formats
    
    // Option 1: Look for content in specific sections (common newsletter patterns)
    let mainContent = findElementsByTagAndClass(doc, "div", ["content", "main-content", "article", "newsletter"]);
    
    // Option 2: If that fails, look for the largest content block
    if (!mainContent || mainContent.length === 0) {
      mainContent = findLargestContentBlock(doc);
    }
    
    // If we found content, extract it
    if (mainContent && mainContent.length > 0) {
      // Extract headings
      const headings = findElementsByTag(mainContent[0], ["h1", "h2", "h3"]);
      for (const heading of headings) {
        content += `<h3>${getElementText(heading)}</h3>`;
      }
      
      // Extract paragraphs
      const paragraphs = findElementsByTag(mainContent[0], ["p"]);
      for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
        content += `<p>${getElementText(paragraphs[i])}</p>`;
      }
      
      // If we couldn't extract specific elements, just use the main content
      if (content.trim() === "") {
        content = getElementText(mainContent[0]);
        
        // Limit content length (summarize to around 300 characters)
        if (content.length > 500) {
          content = content.substring(0, 500) + "...";
        }
      }
    } else {
      // Fallback: Just take the first few hundred characters
      content = html.replace(/<[^>]*>/g, " ").substring(0, 300) + "...";
    }
    
  } catch (e) {
    // XmlService might fail on some complex HTML
    // Fallback to basic content extraction
    content = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Limit content length
    if (content.length > 300) {
      content = content.substring(0, 300) + "...";
    }
  }
  
  return content;
}

/**
 * Helper functions for HTML parsing
 * These would need to be expanded in a real implementation
 */
function findElementsByTagAndClass(element, tagName, classNames) {
  // This is a simplified version - in a real implementation,
  // you would need a more robust way to query elements
  // such as implementing a lightweight DOM traversal
  return []; // Placeholder
}

function findLargestContentBlock(doc) {
  // This would find the largest block of content in the document
  // Again, this is a simplified placeholder
  return []; // Placeholder
}

function findElementsByTag(element, tagNames) {
  // Find elements with the specified tag names
  return []; // Placeholder
}

function getElementText(element) {
  // Extract text from an element
  return ""; // Placeholder
}

/**
 * Sets up a time-based trigger to run the digest daily
 */
function setupDailyTrigger() {
  // Delete any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'createNewsletterDigest') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  
  // Create a new trigger to run daily
  ScriptApp.newTrigger('createNewsletterDigest')
    .timeBased()
    .everyDays(1)
    .atHour(8) // Run at 8 AM
    .create();
    
  Logger.log('Daily newsletter digest trigger set up to run at 8 AM');
}