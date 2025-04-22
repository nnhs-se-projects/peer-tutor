const fs = require('fs');
const path = require('path');
const ejsLint = require('ejs-lint');

// Path to the homepage.ejs file
const homepageEjsPath = path.join(__dirname, '..', 'views', 'homepage.ejs');

// Read the file content
console.log('Reading template file...');
const template = fs.readFileSync(homepageEjsPath, 'utf8');

// Run EJS-Lint on the template
console.log('Checking for EJS syntax errors...');
const lintResult = ejsLint(template);

if (lintResult) {
  console.error('EJS syntax error found:');
  console.error(lintResult);
} else {
  console.log('No EJS syntax errors found! Template is valid.');

  // Ensure the modified template is written back with proper EJS syntax
  let modifiedTemplate = template;

  // Fix any style attributes with EJS expressions
  modifiedTemplate = modifiedTemplate.replace(
    /style="([^"]*<%[-=]([^%>]*)%>[^"]*)"/g,
    (match, styleContent, ejsContent) => {
      // Create a variable for the style in the EJS template
      const variableName = `style_${Math.random().toString(36).substring(2, 10)}`;
      return `<% const ${variableName} = \`${styleContent.replace(/<%[-=]\s*|\s*%>/g, '')}\`; %> style="<%= ${variableName} %>"`;
    }
  );

  // Write the modified template back to the file
  fs.writeFileSync(homepageEjsPath, modifiedTemplate, 'utf8');
  console.log('Template updated with improved EJS syntax.');
}

console.log('Done!');
