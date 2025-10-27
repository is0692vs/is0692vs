const extensionId = "hirokimukai.jules-extension";

const url = "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery";

const body = {
  filters: [{
    criteria: [{
      filterType: 7,
      value: extensionId,
    }],
  }],
  flags: 914,
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json;api-version=3.0-preview.1",
  },
  body: JSON.stringify(body),
})
  .then(res => res.json())
  .then(data => {
    const ext = data.results[0].extensions[0];
    console.log("Extension properties:");
    console.log("- publisher:", ext.publisher);
    console.log("- extensionName:", ext.extensionName);
    console.log("- displayName:", ext.displayName);
    
    // Check for repository URL in different places
    if (ext.properties) {
      console.log("\nProperties:");
      ext.properties.forEach(prop => {
        if (prop.key.toLowerCase().includes('repo') || 
            prop.key.toLowerCase().includes('url') ||
            prop.key.toLowerCase().includes('github')) {
          console.log(`  - ${prop.key}: ${prop.value}`);
        }
      });
    }
    
    if (ext.links) {
      console.log("\nLinks:");
      console.log(JSON.stringify(ext.links, null, 2));
    }
    
    // Full extension object keys
    console.log("\nAvailable keys:", Object.keys(ext));
  })
  .catch(err => console.error("Error:", err));
