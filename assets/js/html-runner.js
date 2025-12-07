// HTML Runner JavaScript
(function() {
    const htmlInput = document.getElementById('htmlInput');
    const previewFrame = document.getElementById('previewFrame');
    const charCount = document.getElementById('charCount');

    // Élő előnézet frissítése
    htmlInput.addEventListener('input', function () {
        const htmlContent = htmlInput.value;
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        previewDoc.open();
        previewDoc.write(htmlContent);
        previewDoc.close();
        
        // Karakterszám frissítése
        charCount.textContent = htmlContent.length + ' karakter';
    });
    
    // === Dropdown kezelés ===
    const dropdownBtn = document.getElementById('snippetDropdownBtn');
    const dropdownContent = document.getElementById('snippetDropdownContent');
    
    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        
        // Kívülre kattintáskor bezárás
        document.addEventListener('click', function() {
            dropdownContent.classList.remove('show');
        });
        
        // Dropdown snippet gombok
        dropdownContent.querySelectorAll('button[data-snippet]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const snippet = this.dataset.snippet;
                const targetBtn = document.getElementById('insert' + snippet.charAt(0).toUpperCase() + snippet.slice(1));
                if (targetBtn) targetBtn.click();
                dropdownContent.classList.remove('show');
            });
        });
    }
    
    // === VSCode-szerű szerkesztési funkciók ===
    
    // Zárójelek párosítása
    const brackets = {
        '(': ')',
        '[': ']',
        '{': '}',
        '<': '>',
        '"': '"',
        "'": "'",
        '`': '`'
    };
    
    htmlInput.addEventListener('keydown', function(e) {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;
        
        // Tab kezelés - beszúrás vagy behúzás
        if (e.key === 'Tab') {
            e.preventDefault();
            
            if (e.shiftKey) {
                // Shift+Tab: behúzás csökkentése
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                const lineContent = value.substring(lineStart, start);
                
                if (lineContent.startsWith('    ')) {
                    this.value = value.substring(0, lineStart) + value.substring(lineStart + 4);
                    this.selectionStart = this.selectionEnd = start - 4;
                } else if (lineContent.startsWith('\t')) {
                    this.value = value.substring(0, lineStart) + value.substring(lineStart + 1);
                    this.selectionStart = this.selectionEnd = start - 1;
                }
            } else {
                // Tab: 4 szóköz beszúrása
                this.value = value.substring(0, start) + '    ' + value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
            this.dispatchEvent(new Event('input'));
            return;
        }
        
        // Enter: automatikus behúzás
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Aktuális sor behúzásának megkeresése
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineContent = value.substring(lineStart, start);
            const indent = lineContent.match(/^[\t ]*/)[0];
            
            // Ellenőrizzük, hogy nyitó zárójel előtt vagyunk-e
            const charBefore = value[start - 1];
            const charAfter = value[start];
            
            let newText = '\n' + indent;
            let cursorOffset = newText.length;
            
            // Ha { } vagy < > között vagyunk, extra behúzás és új sor
            if ((charBefore === '{' && charAfter === '}') || 
                (charBefore === '>' && charAfter === '<') ||
                (charBefore === '[' && charAfter === ']')) {
                newText = '\n' + indent + '    \n' + indent;
                cursorOffset = indent.length + 5;
            } else if (charBefore === '{' || charBefore === '[' || charBefore === '(') {
                newText = '\n' + indent + '    ';
                cursorOffset = newText.length;
            } else if (charBefore === '>') {
                // HTML tag után extra behúzás ha nincs záró tag
                newText = '\n' + indent + '    ';
                cursorOffset = newText.length;
            }
            
            this.value = value.substring(0, start) + newText + value.substring(end);
            this.selectionStart = this.selectionEnd = start + cursorOffset;
            this.dispatchEvent(new Event('input'));
            return;
        }
        
        // Zárójelek automatikus párosítása
        if (brackets[e.key]) {
            const selectedText = value.substring(start, end);
            
            // Ha van kijelölés, körbefogjuk
            if (start !== end) {
                e.preventDefault();
                const wrapped = e.key + selectedText + brackets[e.key];
                this.value = value.substring(0, start) + wrapped + value.substring(end);
                this.selectionStart = start + 1;
                this.selectionEnd = end + 1;
                this.dispatchEvent(new Event('input'));
                return;
            }
            
            // Idézőjeleknél ellenőrizzük, hogy ne duplázzon
            if ((e.key === '"' || e.key === "'" || e.key === '`') && value[start] === e.key) {
                e.preventDefault();
                this.selectionStart = this.selectionEnd = start + 1;
                return;
            }
            
            // Automatikus záró karakter
            e.preventDefault();
            this.value = value.substring(0, start) + e.key + brackets[e.key] + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            this.dispatchEvent(new Event('input'));
            return;
        }
        
        // Záró zárójel átlépése ha már ott van
        if (['}', ']', ')', '>', '"', "'", '`'].includes(e.key) && value[start] === e.key) {
            e.preventDefault();
            this.selectionStart = this.selectionEnd = start + 1;
            return;
        }
        
        // Backspace: páros törlése
        if (e.key === 'Backspace' && start === end && start > 0) {
            const charBefore = value[start - 1];
            const charAfter = value[start];
            
            if (brackets[charBefore] && brackets[charBefore] === charAfter) {
                e.preventDefault();
                this.value = value.substring(0, start - 1) + value.substring(start + 1);
                this.selectionStart = this.selectionEnd = start - 1;
                this.dispatchEvent(new Event('input'));
                return;
            }
        }
    });
    
    // Beszúrás a kurzor pozíciójához
    function insertAtCursor(text) {
        const start = htmlInput.selectionStart;
        const end = htmlInput.selectionEnd;
        const before = htmlInput.value.substring(0, start);
        const after = htmlInput.value.substring(end);
        htmlInput.value = before + text + after;
        htmlInput.selectionStart = htmlInput.selectionEnd = start + text.length;
        htmlInput.focus();
        htmlInput.dispatchEvent(new Event('input'));
    }
    
    // HTML5 Boilerplate
    document.getElementById('insertBoilerplate').addEventListener('click', function() {
        const boilerplate = `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumentum</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <h1>Hello Világ!</h1>
    <p>Kezdj el szerkeszteni...</p>
</body>
</html>`;
        htmlInput.value = boilerplate;
        htmlInput.dispatchEvent(new Event('input'));
    });
    
    // Div beszúrása
    document.getElementById('insertDiv').addEventListener('click', function() {
        insertAtCursor(`<div class="container">
    <p>Tartalom itt...</p>
</div>`);
    });
    
    // Form beszúrása
    document.getElementById('insertForm').addEventListener('click', function() {
        insertAtCursor(`<form action="#" method="post">
    <label for="name">Név:</label>
    <input type="text" id="name" name="name" required>
    
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
    
    <button type="submit">Küldés</button>
</form>`);
    });
    
    // Táblázat beszúrása
    document.getElementById('insertTable').addEventListener('click', function() {
        insertAtCursor(`<table border="1" style="border-collapse: collapse; width: 100%;">
    <thead>
        <tr>
            <th>Fejléc 1</th>
            <th>Fejléc 2</th>
            <th>Fejléc 3</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Adat 1</td>
            <td>Adat 2</td>
            <td>Adat 3</td>
        </tr>
        <tr>
            <td>Adat 4</td>
            <td>Adat 5</td>
            <td>Adat 6</td>
        </tr>
    </tbody>
</table>`);
    });
    
    // Lista beszúrása
    document.getElementById('insertList').addEventListener('click', function() {
        insertAtCursor(`<ul>
    <li>Első elem</li>
    <li>Második elem</li>
    <li>Harmadik elem</li>
</ul>`);
    });
    
    // CSS blokk beszúrása
    document.getElementById('insertCSS').addEventListener('click', function() {
        insertAtCursor(`<style>
    .my-class {
        color: #333;
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
    }
</style>`);
    });
    
    // Flexbox layout
    document.getElementById('insertFlex').addEventListener('click', function() {
        insertAtCursor(`<style>
    .flex-container {
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 10px;
        padding: 20px;
        background: #eee;
    }
    .flex-item {
        background: #4c0bce;
        color: white;
        padding: 20px;
        border-radius: 5px;
    }
</style>
<div class="flex-container">
    <div class="flex-item">Elem 1</div>
    <div class="flex-item">Elem 2</div>
    <div class="flex-item">Elem 3</div>
</div>`);
    });
    
    // Grid layout
    document.getElementById('insertGrid').addEventListener('click', function() {
        insertAtCursor(`<style>
    .grid-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        padding: 20px;
        background: #eee;
    }
    .grid-item {
        background: #4c0bce;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px;
    }
</style>
<div class="grid-container">
    <div class="grid-item">1</div>
    <div class="grid-item">2</div>
    <div class="grid-item">3</div>
    <div class="grid-item">4</div>
    <div class="grid-item">5</div>
    <div class="grid-item">6</div>
</div>`);
    });
    
    // Törlés
    document.getElementById('clearCode').addEventListener('click', function() {
        if (confirm('Biztosan törölni szeretnéd a kódot?')) {
            saveState();
            htmlInput.value = '';
            htmlInput.dispatchEvent(new Event('input'));
        }
    });
    
    // Undo/Redo rendszer
    let undoStack = [];
    let redoStack = [];
    let lastSavedValue = '';
    
    function saveState() {
        if (htmlInput.value !== lastSavedValue) {
            undoStack.push(lastSavedValue);
            redoStack = [];
            lastSavedValue = htmlInput.value;
            // Maximum 50 lépés
            if (undoStack.length > 50) undoStack.shift();
        }
    }
    
    // Mentés minden változásnál (debounce-olva)
    let saveTimeout;
    htmlInput.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveState, 500);
    });
    
    // Undo gomb
    document.getElementById('undoBtn').addEventListener('click', function() {
        if (undoStack.length > 0) {
            redoStack.push(htmlInput.value);
            const previousState = undoStack.pop();
            htmlInput.value = previousState;
            lastSavedValue = previousState;
            htmlInput.dispatchEvent(new Event('input'));
        }
    });
    
    // Redo gomb
    document.getElementById('redoBtn').addEventListener('click', function() {
        if (redoStack.length > 0) {
            undoStack.push(htmlInput.value);
            const nextState = redoStack.pop();
            htmlInput.value = nextState;
            lastSavedValue = nextState;
            htmlInput.dispatchEvent(new Event('input'));
        }
    });
    
    // Undo/Redo billentyűparancsok (külön listener, hogy ne ütközzön)
    document.addEventListener('keydown', function(e) {
        if (document.activeElement !== htmlInput) return;
        
        // Ctrl+Z - Visszavonás
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('undoBtn').click();
        }
        // Ctrl+Y vagy Ctrl+Shift+Z - Újra
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            document.getElementById('redoBtn').click();
        }
    });
})();
