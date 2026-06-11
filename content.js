(function() {
  // Select the divs containing price and listing data
  const listingSelector = '.listing-product-info';

  // Define all currencies with hierarchical weight values for the menu sorting order
  const itemValues = {
    // Custom Currencies (Lowest Priority)
    'Random Gems': 0.01,
    'Perfect Amethyst': 0.02,
    'Key Of Terror': 0.03,
    'Key Of Hate': 0.04,
    'Key Of Destruction': 0.05,
    'Random Minor Key': 0.06,
    'Talic\'s Anguish': 0.07,
    'Korlic\'s Pain': 0.08,
    'Madawc\'s Ire': 0.09,
    'Bul-Kathos\' Nightmare': 0.10,
    'Worusk\'s End': 0.11,
    // Runes
    El: 1, Eld: 2, Tir: 3, Nef: 4, Eth: 5, Ith: 6, Tal: 7, Ral: 8, Ort: 9, Thul: 10,
    Amn: 11, Sol: 12, Shael: 13, Dol: 14, Hel: 15, Io: 16, Lum: 17, Ko: 18, Fal: 19,
    Lem: 20, Pul: 21, Um: 22, Mal: 23, Ist: 24, Gul: 25, Vex: 26, Ohm: 27, Lo: 28,
    Sur: 29, Ber: 30, Jah: 31, Cham: 32, Zod: 33
  };

  // Master regular expression pattern matching all runes, keys, and gems case-insensitively
  const itemRegex = /(\d+)\s*X\s*(Zod|Cham|Jah|Ber|Sur|Lo|Ohm|Vex|Gul|Ist|Mal|Um|Pul|Lem|Fal|Ko|Lum|Io|Hel|Dol|Shael|Sol|Amn|Thul|Ort|Ral|Tal|Ith|Eth|Nef|Tir|Eld|El|Worusk\'s\s*End|Bul-Kathos\'\s*Nightmare|Madawc\'s\s*Ire|Korlic\'s\s*Pain|Talic\'s\s*Anguish|Random\s*Minor\s*Keys?|Key\s*Of\s*Destructions?|Key\s*Of\s*Hates?|Key\s*Of\s*Terrors?|Perfect\s*Amethysts?|Random\s*Gems?)(?:\s*Rune)?/i;

  // Smart string normalizer to map HTML text perfectly to our dictionary keys
  function normalizeItemName(rawName) {
    const lower = rawName.toLowerCase().replace(/\s+/g, ' ');
    if (lower.includes('random gem')) return 'Random Gems';
    if (lower.includes('perfect amethyst')) return 'Perfect Amethyst';
    if (lower.includes('key of terror')) return 'Key Of Terror';
    if (lower.includes('key of hate')) return 'Key Of Hate';
    if (lower.includes('key of destruction')) return 'Key Of Destruction';
    if (lower.includes('random minor key')) return 'Random Minor Key';
    if (lower.includes('talic')) return "Talic's Anguish";
    if (lower.includes('korlic')) return "Korlic's Pain";
    if (lower.includes('madawc')) return "Madawc's Ire";
    if (lower.includes('bul-kathos')) return "Bul-Kathos' Nightmare";
    if (lower.includes('worusk')) return "Worusk's End";
    
    // Fallback normalization for standard runes
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  // Create a function to get the sorted listings
  function getSortedListings() {
    const listings = Array.from(document.querySelectorAll(listingSelector));
    const itemCounts = {};

    listings.forEach(listing => {
      try {
        // Extract the link for the current listing
        const linkElement = listing.querySelector('a.sc-iGgWBj.hCbfch.listing-name.selling-listing');
        const listingUrl = linkElement ? 'https://traderie.com' + linkElement.getAttribute('href') : null;

        // --- Extract bulk quantity prefix safely ---
        let soldItemPrefix = "";
        if (linkElement) {
          const rawTitle = linkElement.textContent.trim();
          // Checks if the listing title begins with a quantity (e.g., "15 X Madawc's Ire")
          const qtyMatch = rawTitle.match(/^(\d+)\s*X\s+(.+)/i);
          if (qtyMatch) {
            const qty = parseInt(qtyMatch[1], 10);
            if (qty > 1) {
              let cleanName = qtyMatch[2];
              // Strip out Traderie's extra injected listing garbage text and game mod tags
              cleanName = cleanName.replace(/(?:Standing|Stock)\s*Listing.*/i, '');
              cleanName = cleanName.replace(/reign of the warlock.*/i, '');
              cleanName = cleanName.replace(/diablo 2 resurrected.*/i, '');
              cleanName = cleanName.replace(/•.*/, '');
              cleanName = cleanName.trim();
              
              soldItemPrefix = `${qty} X ${cleanName} : `;
            }
          }
        }

        // Make sure the listing actually has a price attached
        const priceLines = Array.from(listing.querySelectorAll('.price-line'));
        if (priceLines.length === 0) return;

        let items = [];

        // Scan purely inside the price boxes
        priceLines.forEach((priceLine, index) => {
          // If Traderie uses multiple separate price-lines, treat the gap between them as an OR alternative
          if (index > 0 && items.length > 0 && items[items.length - 1] !== "OR") {
            items.push("OR");
          }

          function walkDOM(node) {
            if (!node) return;
            for (let i = 0; i < node.childNodes.length; i++) {
              let child = node.childNodes[i];
              
              if (child.nodeType === 3) { // It's a raw Text Node
                // Only split into a new option if we hit an explicit "OR" text separator inside the box
                if (/\bOR\b/i.test(child.textContent)) {
                  items.push("OR");
                }
              } else if (child.nodeType === 1) { // It's an HTML Element
                // If it's a link, check if it contains a valid currency pattern
                if (child.tagName === 'A') {
                  const textContent = child.textContent.trim();
                  const match = textContent.match(itemRegex);
                  
                  if (match) {
                    // Pull ONLY the quantity and item name, ignoring junk text
                    const quantity = match[1];
                    const cleanName = normalizeItemName(match[2]);
                    
                    // Check if the item is a rune so we can cleanly append the word "Rune" to the string
                    const isRune = /^(Zod|Cham|Jah|Ber|Sur|Lo|Ohm|Vex|Gul|Ist|Mal|Um|Pul|Lem|Fal|Ko|Lum|Io|Hel|Dol|Shael|Sol|Amn|Thul|Ort|Ral|Tal|Ith|Eth|Nef|Tir|Eld|El)$/i.test(match[2]);
                    
                    items.push(`${quantity} X ${cleanName}${isRune ? ' Rune' : ''}`);
                  } else {
                    walkDOM(child);
                  }
                } else {
                  // Otherwise, keep searching deeper inside this element
                  walkDOM(child);
                }
              }
            }
          }

          // STRICTLY execute walker on the priceLine, bypassing the main item title
          walkDOM(priceLine); 
        });

        let priceOptions = [];
        let currentGroup = [];

        // Process the scanned items into their proper bundled groups
        items.forEach(item => {
          if (item === "OR") {
            if (currentGroup.length > 0) {
              priceOptions.push(currentGroup);
              currentGroup = []; // Start a new alternative path
            }
          } else {
            currentGroup.push(item); // Bundle adjacent currency tokens together
          }
        });
        
        // Push the final group if it contains anything
        if (currentGroup.length > 0) {
          priceOptions.push(currentGroup);
        }

        if (priceOptions.length === 0) return;

        const structuredPriceOptions = [];
        const uniqueItemsInListing = new Set();

        // Calculate values for each bundled package block
        priceOptions.forEach(groupArr => {
          let groupSumValue = 0;
          
          groupArr.forEach(priceStr => {
            groupSumValue += parsePrice(priceStr);
            
            const match = priceStr.match(itemRegex);
            const itemMatch = match && match[2];
            
            if (itemMatch) {
              const normalizedItem = normalizeItemName(itemMatch);
              if (itemValues[normalizedItem]) {
                uniqueItemsInListing.add(normalizedItem);
              }
            }
          });

          if (groupArr.length > 0) {
            structuredPriceOptions.push({
              displayStr: groupArr.join(' + '), // Packages are cleanly joined with a '+'
              value: groupSumValue
            });
          }
        });

        if (structuredPriceOptions.length === 0) return;

        // Rank the listing based on its cheapest available option
        const lowestOptionPrice = Math.min(...structuredPriceOptions.map(o => o.value));
        const fullDisplayPriceString = structuredPriceOptions.map(o => o.displayStr).join(' OR ');
        
        // Construct the final string by appending the bulk item prefix if it exists
        const finalDisplayPriceString = soldItemPrefix + fullDisplayPriceString;

        // Push data to all active category filters found inside the price row
        uniqueItemsInListing.forEach(item => {
          if (!itemCounts[item]) itemCounts[item] = [];
          itemCounts[item].push({ 
            url: listingUrl, 
            price: lowestOptionPrice, 
            displayPrice: finalDisplayPriceString 
          });
        });

      } catch (err) {
        console.error("Skipped an unparseable listing row: ", err);
      }
    });

    return itemCounts;
  }

  // Function to calculate numeric weight valuations for all currencies
  function parsePrice(price) {
    const match = price.match(itemRegex);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const itemName = normalizeItemName(match[2]);
      
      switch (itemName) {
        // High to Low Runes
        case 'Zod': return quantity * 160;
        case 'Cham': return quantity * 140;
        case 'Jah': return quantity * 150;
        case 'Ber': return quantity * 100; 
        case 'Sur': return quantity * 95;
        case 'Lo': return quantity * 130; 
        case 'Ohm': return quantity * 120;
        case 'Vex': return quantity * 110;
        case 'Gul': return quantity * 70;
        case 'Ist': return quantity * 50;
        case 'Mal': return quantity * 45;
        case 'Um': return quantity * 40;
        case 'Pul': return quantity * 30;
        case 'Lem': return quantity * 20;
        case 'Fal': return quantity * 15;
        case 'Ko': return quantity * 8;
        case 'Lum': return quantity * 7;
        case 'Io': return quantity * 6;
        case 'Hel': return quantity * 5.5;
        case 'Dol': return quantity * 5;
        case 'Shael': return quantity * 4.5;
        case 'Sol': return quantity * 4;
        case 'Amn': return quantity * 3.5;
        case 'Thul': return quantity * 3;
        case 'Ort': return quantity * 2.5;
        case 'Ral': return quantity * 2;
        case 'Tal': return quantity * 1.5;
        case 'Ith': return quantity * 1;
        case 'Eth': return quantity * 0.8;
        case 'Nef': return quantity * 0.6;
        case 'Tir': return quantity * 0.4;
        case 'Eld': return quantity * 0.2;
        case 'El': return quantity * 0.1;
        // Miscellaneous Keys and Gems
        case 'Worusk\'s End': return quantity * 0.09;
        case 'Bul-Kathos\' Nightmare': return quantity * 0.08;
        case 'Madawc\'s Ire': return quantity * 0.07;
        case 'Korlic\'s Pain': return quantity * 0.06;
        case 'Talic\'s Anguish': return quantity * 0.05;
        case 'Random Minor Key': return quantity * 0.04;
        case 'Key Of Destruction': return quantity * 0.03;
        case 'Key Of Hate': return quantity * 0.02;
        case 'Key Of Terror': return quantity * 0.015;
        case 'Perfect Amethyst': return quantity * 0.01;
        case 'Random Gems': return quantity * 0.005;
        default: return 0;
      }
    }
    return 0;
  }

  // Create the container to display the sorted listings
  function createListingContainer() {
    const oldContainer = document.querySelector('.d2r-sorted-listings-panel');
    if (oldContainer) oldContainer.remove();

    const itemCounts = getSortedListings();

    const container = document.createElement('div');
    container.className = 'd2r-sorted-listings-panel'; 
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.backgroundColor = '#333';  
    container.style.color = '#fff';  
    container.style.border = '1px solid #444';  
    container.style.padding = '10px';
    container.style.zIndex = 100000; 
    container.style.width = '340px'; 
    container.style.display = 'flex'; // Locked strictly into flex column stack
    container.style.flexDirection = 'column';
    container.style.flexWrap = 'nowrap';
    container.style.overflowY = 'auto';
    container.style.maxHeight = '80vh';
    container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
    container.style.borderRadius = '8px';  
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = 'sans-serif';

    const title = document.createElement('h3');
    title.textContent = `Sorted Listings by Price`;
    title.style.fontSize = '16px';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    container.appendChild(title);

    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Listings';
    refreshButton.style.backgroundColor = '#4CAF50';  
    refreshButton.style.color = '#fff';
    refreshButton.style.padding = '8px';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '5px';
    refreshButton.style.cursor = 'pointer';
    refreshButton.style.marginBottom = '10px';
    refreshButton.style.width = '100%';  
    refreshButton.style.display = 'block';
    refreshButton.addEventListener('click', function() {
      container.remove();
      createListingContainer();  
    });
    container.appendChild(refreshButton);

    // Dynamically render menu options from highest available tier down to lowest
    const sortedItemKeys = Object.keys(itemValues).sort((a, b) => itemValues[b] - itemValues[a]);

    sortedItemKeys.forEach(item => {
      if (itemCounts[item] && itemCounts[item].length > 0) {  
        const itemButton = document.createElement('button');
        itemButton.textContent = `${item} (${itemCounts[item].length})`;
        itemButton.style.backgroundColor = '#58a6ff';
        itemButton.style.color = '#fff';
        itemButton.style.padding = '8px';
        itemButton.style.marginBottom = '10px';
        itemButton.style.border = 'none';
        itemButton.style.cursor = 'pointer';
        itemButton.style.borderRadius = '5px';
        itemButton.style.width = '100%';  
        itemButton.style.display = 'block'; 
        itemButton.style.boxSizing = 'border-box';
        itemButton.addEventListener('click', function() {
          displayFilteredListings(item);
        });
        container.appendChild(itemButton);
      }
    });

    document.body.appendChild(container);
  }

  // Display filtered listings based on the selected item
  function displayFilteredListings(item) {
    const container = document.querySelector('.d2r-sorted-listings-panel');
    if (!container) return;
    container.innerHTML = '';  

    const title = document.createElement('h3');
    title.textContent = `Listings for ${item}`;
    title.style.fontSize = '16px';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    container.appendChild(title);

    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Back to All Listings';
    refreshButton.style.backgroundColor = '#4CAF50';  
    refreshButton.style.color = '#fff';
    refreshButton.style.padding = '8px';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '5px';
    refreshButton.style.cursor = 'pointer';
    refreshButton.style.marginBottom = '10px';
    refreshButton.style.width = '100%';  
    refreshButton.style.display = 'block';
    refreshButton.addEventListener('click', function() {
      container.remove();
      createListingContainer();  
    });
    container.appendChild(refreshButton);

    const filteredListings = getSortedListings()[item] || [];
    filteredListings.sort((a, b) => a.price - b.price); 

    filteredListings.forEach(listing => {
      const listingElement = document.createElement('p');
      listingElement.style.margin = '0 0 8px 0';
      listingElement.style.fontSize = '13px';
      listingElement.style.display = 'block';
      listingElement.innerHTML = `<a href="${listing.url}" target="_blank" style="color: #58a6ff; text-decoration: none; font-weight: bold;">[Link]</a> - ${listing.displayPrice}`;
      container.appendChild(listingElement);
    });
  }

  // Run the initializer sequence
  createListingContainer();
})();
