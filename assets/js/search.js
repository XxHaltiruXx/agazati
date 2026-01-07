// Keresés funkció a főoldalon
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('mainSearch');
    const searchableItems = document.querySelectorAll('[data-search]');
    
    if (!searchInput) return;
    
    // Böngésző autocomplete letiltása
    searchInput.setAttribute('autocomplete', 'off');
    
    // Keresési kategóriák (principais javaslatok)
    const searchCategories = [
        { text: 'HTML', icon: '🌐', link: 'html/alapok' },
        { text: 'CSS', icon: '🎨', link: 'css/alapok' },
        { text: 'Python', icon: '🐍', link: 'python/alapok' },
        { text: 'Hálózat', icon: '📡', link: 'network/alapok' },
        { text: 'Matematika', icon: '📐', link: 'math/alapok' }
    ];
    
    // Javaslatok konténer létrehozása
    let suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'searchSuggestions';
        suggestionsContainer.className = 'search-suggestions';
        suggestionsContainer.style.display = 'none';
        searchInput.parentNode.appendChild(suggestionsContainer);
    }
    
    // Modal létrehozása ha nem létezik
    let modal = document.getElementById('searchModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'searchModal';
        modal.className = 'search-modal';
        modal.innerHTML = `
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <h2 id="searchResultTitle">Keresési eredmények</h2>
                    <button class="search-modal-close" aria-label="Bezárás">&times;</button>
                </div>
                <div class="search-modal-body" id="searchResults">
                    <!-- Eredmények ide kerülnek -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Modal bezárása
    const closeBtn = modal.querySelector('.search-modal-close');
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Modal bezárása klikkelésre kívül
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    function showSuggestions(searchText) {
        const searchLower = searchText.trim().toLowerCase();
        
        // Ha üres a keresés, mutassa az összes kategóriát
        let filteredCategories;
        if (!searchLower) {
            filteredCategories = searchCategories;
        } else {
            filteredCategories = searchCategories.filter(cat => 
                cat.text.toLowerCase().includes(searchLower)
            );
        }
        
        if (filteredCategories.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = filteredCategories.map(cat => `
            <div class="suggestion-item" data-suggestion="${cat.text}" data-link="${cat.link}">
                <span class="suggestion-icon">${cat.icon}</span>
                <span class="suggestion-text">${cat.text}</span>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
        
        // Javaslat kattintás kezelése - navigáljon az oldalra
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const link = this.getAttribute('data-link');
                window.location.href = link;
            });
        });
    }
    
    function filterItems(searchText) {
        const searchLower = searchText.toLowerCase().trim();
        const resultsContainer = document.getElementById('searchResults');
        const resultTitle = document.getElementById('searchResultTitle');
        
        if (searchLower === '') {
            resultTitle.textContent = 'Keresési eredmények';
            resultsContainer.innerHTML = '<p style="text-align: center; color: #ccc;">Írj valamit a kereséshez</p>';
            return;
        }
        
        let results = [];
        let visibleCount = 0;
        
        searchableItems.forEach(item => {
            const searchData = item.getAttribute('data-search').toLowerCase();
            const titleText = item.querySelector('h3')?.textContent.toLowerCase() || '';
            const descText = item.querySelector('p')?.textContent.toLowerCase() || '';
            
            // Össze kutya a keresési szöveget a szövegekkel
            const fullText = searchData + ' ' + titleText + ' ' + descText;
            
            if (fullText.includes(searchLower)) {
                visibleCount++;
                const title = item.querySelector('h3')?.textContent || '';
                const desc = item.querySelector('p')?.textContent || '';
                
                results.push({
                    title: title,
                    description: desc,
                    html: item.innerHTML
                });
            }
        });
        
        // Eredmények megjelenítése
        if (results.length === 0) {
            resultTitle.textContent = 'Nincs találat';
            resultsContainer.innerHTML = `<p style="text-align: center; color: #aaa;">Sajnos nem találtunk eredményt a(z) "<strong>${searchText}</strong>" keresésre.</p>`;
        } else {
            resultTitle.textContent = `Keresési eredmények (${results.length})`;
            resultsContainer.innerHTML = results.map((result, index) => `
                <div class="search-result-item" data-result-index="${index}">
                    <h3>${result.title}</h3>
                    <p>${result.description}</p>
                </div>
            `).join('');
            
            // Kattintási kezelő az eredmények elemeihez - navigáljon az oldalra
            resultsContainer.querySelectorAll('.search-result-item').forEach((item, index) => {
                item.addEventListener('click', function() {
                    const resultItem = searchableItems[Array.from(searchableItems).findIndex(el => {
                        const itemTitle = el.querySelector('h3')?.textContent || '';
                        const itemDesc = el.querySelector('p')?.textContent || '';
                        return itemTitle === results[index].title && itemDesc === results[index].description;
                    })];
                    
                    if (resultItem) {
                        const link = resultItem.getAttribute('data-link');
                        if (link) {
                            window.location.href = link;
                        }
                    }
                });
            });
        }
        
        // Modal megjelenítése
        modal.style.display = 'flex';
    }
    
    // Keresés az input mező írására (javaslatok megjelenítése)
    searchInput.addEventListener('input', function(e) {
        showSuggestions(this.value);
    });
    
    // Fókusz esetén mutassa az összes javaslatot
    searchInput.addEventListener('focus', function(e) {
        showSuggestions(this.value);
    });
    
    // Keresés az Enter billentyű megnyomásakor - nyissa meg a modalt
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchText = this.value.trim().toLowerCase();
            
            // Ellenőrizze, hogy van-e pontos match a kategóriák között
            const exactMatch = searchCategories.find(cat => 
                cat.text.toLowerCase() === searchText
            );
            
            if (exactMatch) {
                // Ha pontos match, vigye az oldalra
                suggestionsContainer.style.display = 'none';
                window.location.href = exactMatch.link;
            } else if (searchText) {
                // Ellenőrizze, hogy csak egy találat van-e
                const filteredCategories = searchCategories.filter(cat => 
                    cat.text.toLowerCase().includes(searchText)
                );
                
                if (filteredCategories.length === 1) {
                    // Ha csak egy találat van, vigye oda
                    suggestionsContainer.style.display = 'none';
                    window.location.href = filteredCategories[0].link;
                } else {
                    // Ha több találat vagy nincs, nyissa meg a modalt
                    suggestionsContainer.style.display = 'none';
                    filterItems(this.value);
                }
            }
        }
    });
    
    // Keresés a gomb kattintásakor - nyissa meg a modalt
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const searchText = searchInput.value.trim().toLowerCase();
            
            // Ellenőrizze, hogy van-e pontos match a kategóriák között
            const exactMatch = searchCategories.find(cat => 
                cat.text.toLowerCase() === searchText
            );
            
            if (exactMatch) {
                // Ha pontos match, vigye az oldalra
                suggestionsContainer.style.display = 'none';
                window.location.href = exactMatch.link;
            } else if (searchText) {
                // Ellenőrizze, hogy csak egy találat van-e
                const filteredForNav = searchCategories.filter(cat => 
                    cat.text.toLowerCase().includes(searchText)
                );
                
                if (filteredForNav.length === 1) {
                    // Ha csak egy match van, vigye oda
                    suggestionsContainer.style.display = 'none';
                    window.location.href = filteredForNav[0].link;
                } else {
                    // Ha nincs pontos match, nyissa meg a modalt
                    suggestionsContainer.style.display = 'none';
                    filterItems(searchInput.value);
                }
            }
        });
    }
    
    // Javaslatok elrejtése kívülre kattintáskor
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper')) {
            suggestionsContainer.style.display = 'none';
        }
    });
});

