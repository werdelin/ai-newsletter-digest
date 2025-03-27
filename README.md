# NewsletterDigest

NewsletterDigest is an intelligent Google Apps Script that transforms your Substack newsletter inbox into a beautifully formatted daily digest. It automatically collects newsletters from the last 24 hours, analyzes their content using AI, and creates a comprehensive yet concise summary that saves you time while keeping you informed.

## Key Features

• Daily digest delivered at 8 AM
• Smart categorization of newsletters (News, Analysis, Opinion)
• AI-powered extraction of key insights and takeaways
• Beautiful HTML formatting with easy navigation
• Table of contents and quick links to original content
• Special highlighting of news context and actionable nuggets
• Automatic removal of boilerplate and promotional content

The digest is designed to minimize the need to read the original newsletters while ensuring you don't miss any important information. It's perfect for busy professionals who want to stay informed but don't have time to read through multiple newsletters each day.

## Setup Instructions

1. Create a new Google Apps Script project
2. Copy the contents of `newsletterDigest.js` into your project
3. Set up your OpenAI API key:
   - In the Apps Script editor, go to Project Settings > Script Properties
   - Add a new property named `OPENAI_API_KEY` with your OpenAI API key
4. Label your Substack newsletters with the 'substack' label in Gmail
5. Deploy the script:
   - Click "Deploy" > "New deployment"
   - Choose "Time-driven" as the deployment type
   - Set it to run daily at 8 AM
   - Authorize the script when prompted

## Usage

Once set up, the script will automatically:
- Collect newsletters from the last 24 hours
- Generate a beautifully formatted digest
- Send it to your email address at 8 AM daily

You can also manually trigger the digest at any time by running the `runDigestNow()` function in the Apps Script editor.

## Requirements

- Google Workspace account
- OpenAI API key
- Gmail access
- Substack newsletters labeled with 'substack' in Gmail

## Customization

The script can be customized by modifying:
- The delivery time (currently set to 8 AM)
- The digest format and styling
- The AI analysis parameters
- The number of newsletters included

## Support

For issues or questions, please open an issue in the GitHub repository.

## License

MIT License - feel free to use and modify as needed. 