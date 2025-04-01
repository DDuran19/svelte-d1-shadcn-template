# -*- coding: utf-8 -*-
"""
Docster 🧠📁

Docster is a single-file Python tool that crawls your project directory, collects relevant code files,
and exposes their contents through a clean web interface built with Flask and PicoCSS.

🔍 **Purpose**
- Designed to serve as a "context gatherer" for Large Language Models (LLMs), enabling tools like AI code assistants,
  chatbots, or search systems to get a snapshot of your codebase without parsing irrelevant files.
- Ideal for developers who want a quick, formatted markdown-style dump of all relevant files or search for
  specific functions or variable definitions across a project.

📦 **Features**
- Loads configuration from a `.docster` JSON file (auto-generated if not found).
- Crawls the current working directory and recursively reads files (e.g., `.ts`, `.js`, `.md`, `.py`, `.svelte`, etc.).
- Skips ignored folders, files, and file types based on regex patterns in config.
- Formats content in Markdown-style blocks:
    ```ts
    // src/utils/example.ts
    function helloWorld() { ... }
    ```
- Handles binary files gracefully by showing a placeholder.
- Built-in function and variable extraction logic using regex and brace-matching (JavaScript/TypeScript style).
- Live web UI with search, copy, and config viewer features.

🌐 **Web Interface**
- Served locally on http://127.0.0.1:3222
- Two-pane UI: control panel on the left, output viewer on the right.
- Search bar supports keyword-based extraction of code blocks (e.g., `functionName`, `const something =`).
- Copy-to-clipboard and status updates built-in.

⚙️ **How to Use**
1. Run the script: `python docster.py`
2. The first time you run it, Docster will:
   - Create a `docster/` folder with a prebuilt `index.html` UI.
   - Generate a `.docster` file with sensible defaults.
   - Crawl your project for files.
   - Launch the web UI in your default browser.
3. Use the interface to rerun crawls, view all content, or search for definitions.

🧠 **LLM Use Case**
- Pipe the full output or individual extracted snippets into a prompt for your LLM-based assistant.
- Enables intelligent contextual querying (e.g., "What does `useMyHook` do?" or "How is the `apiClient` constructed?").

🔒 **Limitations**
- Parsing is regex-based — not a full parser or AST, so false positives are possible.
- Works best with well-formatted JavaScript, TypeScript, Python, or Markdown projects.
- Does not index deeply nested folders with ignored names or binary content.

Author: Denver James Duran
"""


import os
import json
import re
import sys
import time
import webbrowser
import threading
from pathlib import Path
from flask import Flask, jsonify, request, render_template_string, send_from_directory

# --- Constants ---
DOCSTER_DIR_NAME = "docster"
CONFIG_FILE_NAME = ".docster"
DEFAULT_PORT = 3222
CURRENT_WORKING_DIR = Path.cwd()
DOCSTER_DIR_PATH = CURRENT_WORKING_DIR / DOCSTER_DIR_NAME
CONFIG_FILE_PATH = CURRENT_WORKING_DIR / CONFIG_FILE_NAME

# --- Default Configuration ---
DEFAULT_CONFIG = {
    "ignored": {
        "folders": ["node_modules", ".git", ".vscode", "__pycache__", "dist", "build", DOCSTER_DIR_NAME],
        "files": [r"\.env.*", r"package-lock\.json", r"yarn\.lock"],
        "fileTypes": [r"\.log", r"\.tmp", r"\.swp", r"\.DS_Store"]
    },
    "crawl_file_types": [r"\.ts$", r"\.svelte$", r"\.js$", r"\.md$", r"\.py$", r"\.html$", r"\.css$", r"\.jsx$", r"\.tsx$", r"\.json$", r"\.txt$"],
    "binary_file_types": [r"\.png$", r"\.jpg$", r"\.jpeg$", r"\.gif$", r"\.bmp$", r"\.ico$", r"\.pdf$", r"\.zip$", r"\.gz$", r"\.tar$", r"\.woff$", r"\.woff2$", r"\.eot$", r"\.ttf$", r"\.otf$", r"\.mp4$", r"\.webm$", r"\.ogg$", r"\.mp3$"]
    # "ai_api_key": None # Example placeholder
}

# --- Global State ---
crawled_data_store = {"files": [], "timestamp": None}
config_store = {}

# --- HTML Template (using PicoCSS) ---
INDEX_HTML = """
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Docster</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <style>
        :root {
            --spacing-vertical: 2rem;
            --spacing-horizontal: 1.5rem;
        }
        body { padding: var(--spacing-vertical) var(--spacing-horizontal); }
        .grid { display: grid; grid-template-columns: 300px 1fr; gap: var(--spacing-horizontal); height: calc(100vh - 2 * var(--spacing-vertical)); }
        .left-panel { display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
        .right-panel { display: flex; flex-direction: column; height: 100%; }
        #result-area { flex-grow: 1; font-family: monospace; white-space: pre-wrap; word-wrap: break-word; resize: none; }
        .copy-button { position: absolute; top: calc(var(--spacing-vertical) + 0.5rem); right: calc(var(--spacing-horizontal) + 0.5rem); z-index: 10;}
        .search-container { display: flex; gap: 0.5rem; align-items: center; }
        .search-container input[type="search"] { flex-grow: 1; margin-bottom: 0; }
        .search-container button { min-width: 40px; padding: 0.5rem; line-height: 1; } /* Adjust button size */
        #status { margin-top: 1rem; font-style: italic; }
        .button-group { display: flex; flex-direction: column; gap: 0.5rem; }
         summary[role="button"] { padding: 0.5rem 1rem; } /* Adjust details padding */
         details > div { padding: 1rem; border: 1px solid var(--contrast); border-top: none; margin-bottom: 1rem; }
         h6 { margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <main class="container-fluid">
        <div class="grid">
            <!-- Left Panel -->
            <aside class="left-panel">
                <h4>Docster Controls</h4>
                 <div class="button-group">
                    <button id="rerun-btn" onclick="rerunCrawl()">Rerun Crawl</button>
                    <button id="all-btn" onclick="getAllContent()">View All Content</button>
                 </div>

                <div class="search-container">
                    <input type="search" id="search-input" placeholder="Search keyword/function...">
                    <button id="search-btn" onclick="searchContent()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                        </svg>
                    </button>
                </div>
                <div id="status">Ready.</div>
                <details>
                    <summary role="button" class="secondary outline">Config</summary>
                    <div>
                        <h6>Ignored Folders:</h6>
                        <small><pre id="ignored-folders"></pre></small>
                        <h6>Ignored Files (Regex):</h6>
                        <small><pre id="ignored-files"></pre></small>
                        <h6>Ignored File Types (Regex):</h6>
                        <small><pre id="ignored-file-types"></pre></small>
                         <h6>Crawled File Types (Regex):</h6>
                        <small><pre id="crawled-file-types"></pre></small>
                    </div>
                </details>
            </aside>

            <!-- Right Panel -->
            <section class="right-panel">
                 <button class="copy-button outline" onclick="copyToClipboard()">Copy</button>
                 <textarea id="result-area" readonly placeholder="Results will appear here..."></textarea>
            </section>
        </div>
    </main>

    <script>
        const resultArea = document.getElementById('result-area');
        const statusDiv = document.getElementById('status');
        const searchInput = document.getElementById('search-input');
        const rerunBtn = document.getElementById('rerun-btn');
        const allBtn = document.getElementById('all-btn');
        const searchBtn = document.getElementById('search-btn');

        // Function to update status
        function updateStatus(message, isLoading = false) {
            statusDiv.textContent = message;
            rerunBtn.disabled = isLoading;
            allBtn.disabled = isLoading;
            searchBtn.disabled = isLoading;
            searchInput.disabled = isLoading;
            if (isLoading) {
                rerunBtn.setAttribute('aria-busy', 'true');
            } else {
                rerunBtn.removeAttribute('aria-busy');
            }
        }

        // Function to fetch and display all content
        async function getAllContent() {
            updateStatus('Fetching all content...', true);
            resultArea.value = ''; // Clear previous results
            try {
                const response = await fetch('/get_all');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                resultArea.value = data.content || 'No content found.';
                updateStatus(`Displayed all content (${data.file_count} files). Last updated: ${data.timestamp}`);
            } catch (error) {
                console.error('Error fetching all content:', error);
                resultArea.value = `Error fetching content: ${error.message}`;
                updateStatus('Error fetching content.', false);
            }
        }

        // Function to trigger a rerun of the crawl
        async function rerunCrawl() {
            updateStatus('Rerunning crawl...', true);
            resultArea.value = ''; // Clear results on rerun
            try {
                const response = await fetch('/rerun', { method: 'POST' });
                 if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error during rerun.' }));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                updateStatus(data.message || 'Crawl finished.', false);
                // Optionally auto-refresh 'all' view after rerun:
                // await getAllContent();
            } catch (error) {
                console.error('Error rerunning crawl:', error);
                resultArea.value = `Error rerunning crawl: ${error.message}`;
                updateStatus('Error during crawl.', false);
            }
        }

        // Function to search content
        async function searchContent() {
            const keyword = searchInput.value.trim();
            if (!keyword) {
                updateStatus('Please enter a search keyword.');
                return;
            }
            updateStatus(`Searching for "${keyword}"...`, true);
            resultArea.value = ''; // Clear previous results
            try {
                const response = await fetch(`/search?keyword=${encodeURIComponent(keyword)}`);
                 if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                resultArea.value = data.content || `No results found for "${keyword}".`;
                 updateStatus(`Search complete for "${keyword}". ${data.match_count} matches found.`);
            } catch (error) {
                console.error('Error searching content:', error);
                resultArea.value = `Error searching content: ${error.message}`;
                updateStatus('Error during search.', false);
            }
        }

        // Function to copy text to clipboard
        function copyToClipboard() {
            if (!navigator.clipboard) {
                // Fallback for older browsers
                try {
                    resultArea.select();
                    document.execCommand('copy');
                    updateStatus('Content copied (fallback method).');
                } catch (err) {
                    updateStatus('Failed to copy content.');
                    console.error('Fallback copy failed:', err);
                }
                return;
            }
            navigator.clipboard.writeText(resultArea.value).then(() => {
                updateStatus('Content copied to clipboard!');
                // Briefly change button text/style for feedback
                const copyButton = document.querySelector('.copy-button');
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => { copyButton.textContent = originalText; }, 1500);
            }).catch(err => {
                console.error('Async clipboard copy failed:', err);
                updateStatus('Failed to copy content.');
            });
        }

        // Add event listener for Enter key in search input
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if it were in a form
                searchContent();
            }
        });

         // Function to load and display config
        async function loadConfig() {
             try {
                const response = await fetch('/get_config');
                if (!response.ok) throw new Error('Failed to load config');
                const config = await response.json();

                document.getElementById('ignored-folders').textContent = config.ignored?.folders?.join('\\n') || 'None';
                document.getElementById('ignored-files').textContent = config.ignored?.files?.join('\\n') || 'None';
                document.getElementById('ignored-file-types').textContent = config.ignored?.fileTypes?.join('\\n') || 'None';
                document.getElementById('crawled-file-types').textContent = config.crawl_file_types?.join('\\n') || 'None';

            } catch (error) {
                console.error("Error loading config:", error);
                statusDiv.textContent = "Error loading config details.";
            }
        }

        // Initial load
        window.onload = () => {
            updateStatus('Docster ready. Performing initial load...');
            getAllContent(); // Load initial data
            loadConfig();    // Load config display
        };

    </script>
</body>
</html>
"""

# --- Helper Functions ---

def ensure_docster_dir_and_config():
    """Creates the docster directory, html file, and default config if they don't exist."""
    print(f"[*] Ensuring Docster directory exists at: {DOCSTER_DIR_PATH}")
    try:
        DOCSTER_DIR_PATH.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        print(f"[!] Error creating directory {DOCSTER_DIR_PATH}: {e}", file=sys.stderr)
        sys.exit(1)

    # Write/overwrite index.html
    index_html_path = DOCSTER_DIR_PATH / "index.html"
    try:
        with open(index_html_path, "w", encoding="utf-8") as f:
            f.write(INDEX_HTML)
        print(f"[*] Updated/Created {index_html_path}")
    except IOError as e:
        print(f"[!] Error writing {index_html_path}: {e}", file=sys.stderr)
        # Continue if possible, UI might be broken

    # Create default .docster config if it doesn't exist in CWD
    if not CONFIG_FILE_PATH.exists():
        print(f"[*] Creating default config file: {CONFIG_FILE_PATH}")
        try:
            with open(CONFIG_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_CONFIG, f, indent=4)
        except IOError as e:
            print(f"[!] Error writing default config file {CONFIG_FILE_PATH}: {e}", file=sys.stderr)
            # Use default config in memory

def load_config():
    """Loads configuration from .docster file or uses defaults."""
    global config_store
    if CONFIG_FILE_PATH.exists():
        try:
            with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
                loaded_config = json.load(f)
                # Basic validation/merging with defaults
                config_store = DEFAULT_CONFIG.copy()
                config_store.update(loaded_config)
                # Ensure ignored structure exists
                if "ignored" not in config_store:
                    config_store["ignored"] = DEFAULT_CONFIG["ignored"]
                else:
                    for key in DEFAULT_CONFIG["ignored"]:
                         if key not in config_store["ignored"]:
                             config_store["ignored"][key] = DEFAULT_CONFIG["ignored"][key]

                # Ensure required keys exist, falling back to default if necessary
                for key in ["crawl_file_types", "binary_file_types"]:
                     if key not in config_store:
                         config_store[key] = DEFAULT_CONFIG[key]

                print(f"[*] Loaded configuration from {CONFIG_FILE_PATH}")
                return config_store
        except json.JSONDecodeError as e:
            print(f"[!] Error decoding JSON from {CONFIG_FILE_PATH}: {e}. Using default config.", file=sys.stderr)
        except IOError as e:
            print(f"[!] Error reading config file {CONFIG_FILE_PATH}: {e}. Using default config.", file=sys.stderr)
        except Exception as e:
            print(f"[!] Unexpected error loading config: {e}. Using default config.", file=sys.stderr)
    else:
        print(f"[*] Config file {CONFIG_FILE_PATH} not found. Using default config.")

    config_store = DEFAULT_CONFIG.copy()
    return config_store

def compile_regex_list(patterns):
    """Compiles a list of regex patterns, handling invalid ones."""
    compiled = []
    if not patterns: return compiled
    for pattern in patterns:
        try:
            compiled.append(re.compile(pattern))
        except re.error as e:
            print(f"[!] Invalid regex pattern '{pattern}' ignored: {e}", file=sys.stderr)
    return compiled

def is_ignored(path_str, ignore_patterns):
    """Checks if a path string matches any of the compiled regex patterns."""
    for pattern in ignore_patterns:
        if pattern.search(path_str):
            return True
    return False

def perform_crawl(root_dir=CURRENT_WORKING_DIR):
    """Crawls the directory, reads files based on config, and updates global store."""
    global crawled_data_store, config_store
    print(f"[*] Starting crawl from: {root_dir}")
    config = config_store # Use the globally loaded config

    ignored_folders_patterns = compile_regex_list(config.get("ignored", {}).get("folders", []))
    ignored_files_patterns = compile_regex_list(config.get("ignored", {}).get("files", []))
    ignored_file_types_patterns = compile_regex_list(config.get("ignored", {}).get("fileTypes", []))
    crawl_file_types_patterns = compile_regex_list(config.get("crawl_file_types", []))
    binary_file_types_patterns = compile_regex_list(config.get("binary_file_types", []))

    # Add docster dir to ignored folders patterns dynamically if not already present via regex
    docster_dir_name_escaped = re.escape(DOCSTER_DIR_NAME)
    if not any(p.pattern.endswith(f'{docster_dir_name_escaped}$') or docster_dir_name_escaped in p.pattern for p in ignored_folders_patterns):
         try:
             ignored_folders_patterns.append(re.compile(f"^{re.escape(str(DOCSTER_DIR_PATH.relative_to(root_dir)))}$"))
             ignored_folders_patterns.append(re.compile(f".*{re.escape(os.path.sep)}{docster_dir_name_escaped}$")) # Match if it's a subdirectory anywhere
         except ValueError: # Handle case where DOCSTER_DIR_PATH is not relative to root_dir (e.g. different drives)
             print(f"[!] Cannot automatically ignore {DOCSTER_DIR_PATH} as it's not relative to {root_dir}. Ensure it's ignored via .docster config.", file=sys.stderr)
         except re.error as e:
             print(f"[!] Error compiling regex for {DOCSTER_DIR_NAME} ignore rule: {e}", file=sys.stderr)


    results = []
    file_count = 0
    ignored_folder_count = 0
    ignored_file_count = 0

    for current_path_str, dirnames, filenames in os.walk(root_dir, topdown=True):
        current_path = Path(current_path_str)
        relative_dir_path = current_path.relative_to(root_dir)

        # Filter directories *before* os.walk descends into them
        original_dir_count = len(dirnames)
        dirnames[:] = [
            d for d in dirnames
            if not is_ignored(str(relative_dir_path / d), ignored_folders_patterns) and
               not is_ignored(d, ignored_folders_patterns) # Check folder name itself too
        ]
        ignored_folder_count += original_dir_count - len(dirnames)

        for filename in filenames:
            file_path = current_path / filename
            relative_file_path_str = str(file_path.relative_to(root_dir))
            file_ext = file_path.suffix.lower()

            # Check ignore rules
            if is_ignored(relative_file_path_str, ignored_files_patterns) or \
               is_ignored(filename, ignored_files_patterns) or \
               is_ignored(file_ext, ignored_file_types_patterns):
                ignored_file_count += 1
                # print(f"Ignoring file: {relative_file_path_str}")
                continue

            # Check if it's a binary type we defined
            is_binary = is_ignored(file_ext, binary_file_types_patterns) or is_ignored(relative_file_path_str, binary_file_types_patterns)

            # Check if it's a type we want to crawl *unless* it's binary
            should_crawl = any(pattern.search(relative_file_path_str) for pattern in crawl_file_types_patterns)

            content = None
            read_error = False

            if is_binary:
                 content = f"-- {file_ext[1:] if file_ext else 'binary'} file format, cannot be read as text --"
            elif should_crawl:
                try:
                    with open(file_path, "r", encoding="utf-8", errors='strict') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    content = "-- File possibly binary or non-utf8 encoding, cannot be read as text --"
                    read_error = True
                except IOError as e:
                    content = f"-- Error reading file: {e} --"
                    read_error = True
                except Exception as e:
                    content = f"-- Unexpected error reading file: {e} --"
                    read_error = True
            else:
                 # Don't include files we don't explicitly want to crawl
                 ignored_file_count += 1
                 continue


            file_info = {
                "path": relative_file_path_str.replace("\\", "/"), # Normalize path separators
                "type": f"{file_ext[1:]}\n\n" if file_ext else "unknown\n",
                "content": content,
                "error": read_error
            }
            results.append(file_info)
            file_count += 1


    crawled_data_store["files"] = results
    crawled_data_store["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[*] Crawl finished. Found {file_count} files.")
    print(f"[*] Ignored {ignored_folder_count} folders and {ignored_file_count} files based on config.")
    return True


def format_all_content(data):
    """Formats the crawled data into the specified markdown-like string."""
    output = []
    for file_info in data.get("files", []):
        output.append(f"// {file_info['path']}\n```{file_info['type']}")
        output.append(file_info['content'])
        output.append("```\n\n") # Add separator
    return "".join(output)

# --- Function/Variable Extraction Logic (Regex based - Basic) ---
# Regex patterns (can be refined)
# Simple function: function name(...) { ... }
FUNC_REGEX = r"(?:^|\s)(?:async\s+)?function\s+([\w\$_]+)\s*\([^)]*\)\s*\{"
# Arrow function assigned to const/let/var: const name = (...) => { ... } or (...) => ...
ARROW_FUNC_REGEX = r"(?:const|let|var)\s+([\w\$_]+)\s*=\s*(?:\([^)]*\)|[\w\$_]+)\s*=>\s*(?:\{|\(.*\)|[\w\$_]+|\S+)" # Simplified: finds declaration line
# Variable declaration: const/let/var name = ...; (excluding functions)
VAR_REGEX = r"(?:const|let|var)\s+([\w\$_]+)\s*(?:[:=].*?)?(?:;|$)" # Finds declaration line, avoids arrow funcs roughly

def find_matching_brace(text, start_index):
    """
    Finds the matching closing brace '}' for an opening brace '{' at or after start_index,
    while ignoring braces inside strings and comments.
    
    This implementation handles:
      - Single-line comments (// ...),
      - Multi-line comments (/* ... */),
      - Single-quoted, double-quoted, and backtick-quoted strings (with escape sequences).
    
    Returns the index of the matching '}' or -1 if not found.
    """
    # Ensure we start at an opening brace if possible.
    if text[start_index] != '{':
        # Find the next '{'
        start_index = text.find('{', start_index)
        if start_index == -1:
            return -1

    brace_level = 0
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    in_single_line_comment = False
    in_multi_line_comment = False

    i = start_index
    while i < len(text):
        c = text[i]

        # Handle exiting or continuing comments/strings first
        if in_single_line_comment:
            if c == "\n":
                in_single_line_comment = False
        elif in_multi_line_comment:
            if c == "*" and i + 1 < len(text) and text[i + 1] == "/":
                in_multi_line_comment = False
                i += 1  # Skip the '/'
        elif in_single_quote:
            if c == "\\":
                i += 1  # Skip escaped character
            elif c == "'":
                in_single_quote = False
        elif in_double_quote:
            if c == "\\":
                i += 1
            elif c == '"':
                in_double_quote = False
        elif in_backtick:
            if c == "\\":
                i += 1
            elif c == "`":
                in_backtick = False
        else:
            # Only check for new strings or comments when not already inside one
            if c == "/" and i + 1 < len(text):
                next_char = text[i + 1]
                if next_char == "/":
                    in_single_line_comment = True
                    i += 1  # Skip next char
                elif next_char == "*":
                    in_multi_line_comment = True
                    i += 1  # Skip next char
            elif c == "'":
                in_single_quote = True
            elif c == '"':
                in_double_quote = True
            elif c == "`":
                in_backtick = True
            elif c == "{":
                brace_level += 1
            elif c == "}":
                brace_level -= 1
                if brace_level == 0:
                    return i
        i += 1

    return -1  # No matching brace found


def extract_code_block(content, keyword):
    """
    Extracts a code block (function or variable definition) containing the given keyword.
    
    This improved version uses precompiled regex patterns and tracks the character offset
    for precise extraction. It attempts to locate the opening brace '{' in the candidate 
    declaration (either on the same line or in following lines) and then finds the 
    corresponding closing brace using a helper function `find_matching_brace`.
    
    Returns the extracted block as a string, or None if no matching block is found.
    """
    # Precompile regex patterns for different types of declarations
    func_pattern = re.compile(rf"(?:async\s+)?function\s+{re.escape(keyword)}\s*\(")
    arrow_pattern = re.compile(rf"(?:const|let|var)\s+{re.escape(keyword)}\s*=\s*(?:\([^)]*\)|[\w\$_]+)\s*=>")
    var_pattern = re.compile(rf"^(?:const|let|var)\s+{re.escape(keyword)}\s*(?:[=:]|;|$)")

    lines = content.splitlines()
    total_offset = 0  # Tracks the cumulative character offset in 'content'

    for i, line in enumerate(lines):
        # Check if this line contains any declaration matching our patterns
        if func_pattern.search(line) or arrow_pattern.search(line) or var_pattern.search(line.strip()):
            line_offset = total_offset  # Starting offset for the candidate line

            # Attempt to locate the opening brace '{' on this line
            if "{" in line:
                opening_index = line.find("{") + line_offset
            else:
                # Look ahead into subsequent lines for the first occurrence of '{'
                remaining_text = "\n".join(lines[i:])
                brace_match = re.search(r'\{', remaining_text)
                if brace_match:
                    opening_index = line_offset + brace_match.start()
                else:
                    # No brace found; assume it's a simple one-line declaration.
                    return line

            # Use a helper to find the corresponding closing brace.
            # The helper function 'find_matching_brace' should use a stack-based approach.
            closing_index = find_matching_brace(content, opening_index)
            if closing_index != -1:
                # Extract from the start of the candidate line to the matching closing brace.
                return content[line_offset:closing_index+1]
            else:
                # If no matching brace is found, return a fallback block.
                fallback_block = "\n".join(lines[i:i+5])
                return fallback_block + "\n... (Block end not reliably found)\n"

        # Update offset (include the newline character length)
        total_offset += len(line) + 1

    # No matching block found
    return None

def search_content(keyword):
    """Searches for keyword in crawled data, attempting code block extraction."""
    results = []
    match_count = 0
    global crawled_data_store
    files_data = crawled_data_store.get("files", [])

    # Compile regexes once if needed for keyword context check (optional enhancement)
    # is_function_kw = re.compile(r"(?:function|=>)\s*" + re.escape(keyword)) # Simple check

    for file_info in files_data:
        content = file_info.get("content", "")
        path = file_info.get("path", "unknown")
        file_type = file_info.get("type", "unknown")

        # Basic keyword search first
        if keyword in content:
            # Attempt to extract a relevant code block
            extracted_block = extract_code_block(content, keyword)

            if extracted_block:
                 # Add comment indicating potential extraction
                 results.append(f"// {path} (Code block for '{keyword}')\n```{file_type}")
                 results.append(extracted_block.strip())
                 results.append("\n```\n\n")
                 match_count += 1
            else:
                 # Fallback: Show the whole file if block extraction failed but keyword exists
                 results.append(f"// {path} (Keyword '{keyword}' found - full file shown)\n```{file_type}")
                 results.append(content)
                 results.append("\n```\n\n")
                 match_count += 1


    formatted_output = "".join(results)
    return formatted_output, match_count


# --- Flask Application ---
app = Flask(__name__, static_folder=DOCSTER_DIR_PATH.name, template_folder=DOCSTER_DIR_PATH.name)
# Use a secret key for session management, flash messages, etc. (optional here)
app.secret_key = os.urandom(24)

@app.route('/')
def index():
    """Serves the main HTML page."""
    # return send_from_directory(DOCSTER_DIR_PATH.name, 'index.html')
    # Render the string directly to avoid dependency on finding the file if FS ops failed
    return render_template_string(INDEX_HTML)

@app.route('/rerun', methods=['POST'])
def rerun_endpoint():
    """Triggers a new crawl."""
    try:
        success = perform_crawl()
        if success:
            return jsonify({"message": f"Crawl complete. {len(crawled_data_store['files'])} files processed. Updated: {crawled_data_store['timestamp']}"}), 200
        else:
             return jsonify({"error": "Crawl process failed."}), 500
    except Exception as e:
        print(f"[!] Error during /rerun: {e}", file=sys.stderr)
        return jsonify({"error": f"An internal error occurred during crawl: {e}"}), 500


@app.route('/get_all', methods=['GET'])
def get_all_endpoint():
    """Returns all crawled content."""
    global crawled_data_store
    formatted_content = format_all_content(crawled_data_store)
    return jsonify({
        "content": formatted_content,
        "file_count": len(crawled_data_store.get("files", [])),
        "timestamp": crawled_data_store.get("timestamp", "N/A")
    })

@app.route('/search', methods=['GET'])
def search_endpoint():
    """Searches the crawled content for a keyword."""
    keyword = request.args.get('keyword', '')
    if not keyword:
        return jsonify({"error": "Missing search keyword"}), 400

    try:
        search_results, match_count = search_content(keyword)
        return jsonify({
            "content": search_results,
            "match_count": match_count,
            "timestamp": crawled_data_store.get("timestamp", "N/A")
            })
    except Exception as e:
        print(f"[!] Error during /search for '{keyword}': {e}", file=sys.stderr)
        return jsonify({"error": f"An internal error occurred during search: {e}"}), 500


@app.route('/get_config', methods=['GET'])
def get_config_endpoint():
    """Returns the current configuration being used."""
    global config_store
    # Return a copy to avoid potential modification issues if complex objects were used
    return jsonify(config_store.copy())


# --- Main Execution ---
def open_browser():
    """Opens the web browser to the Flask app."""
    try:
        webbrowser.open(f"http://127.0.0.1:{DEFAULT_PORT}/")
        print(f"[*] Attempted to open web browser to http://127.0.0.1:{DEFAULT_PORT}/")
    except Exception as e:
        print(f"[!] Could not open web browser automatically: {e}", file=sys.stderr)
        print(f"[*] Please open your browser and navigate to http://127.0.0.1:{DEFAULT_PORT}/ manually.")

if __name__ == "__main__":
    print("--- Starting Docster ---")

    # 1. Ensure directories and config are set up
    ensure_docster_dir_and_config()

    # 2. Load configuration
    load_config() # Loads into global config_store

    # 3. Perform initial crawl
    try:
        perform_crawl()
    except Exception as e:
        print(f"[!] Critical error during initial crawl: {e}", file=sys.stderr)
        # Decide if app should exit or continue with empty/partial data
        # For now, continue, UI will show errors or no data.

    # 4. Start Flask app in a separate thread or use development server's auto-reloader (but we need browser open)
    print(f"[*] Starting Flask web server on http://127.0.0.1:{DEFAULT_PORT}/")
    print("[*] Press CTRL+C to stop the server.")

    # Use a timer to open the browser shortly after the server *should* be up.
    # This is more reliable than opening it immediately.
    threading.Timer(1.5, open_browser).start()

    # Run Flask server
    try:
        # Setting debug=False for production-like behavior (single process unless threaded=True)
        # Use threaded=True to handle multiple requests concurrently if needed,
        # though for this simple UI it might not be essential.
        app.run(host="127.0.0.1", port=DEFAULT_PORT, debug=False, threaded=True)
    except OSError as e:
        if "address already in use" in str(e).lower():
            print(f"[!] Error: Port {DEFAULT_PORT} is already in use. Please stop the existing process or choose a different port.", file=sys.stderr)
        else:
            print(f"[!] Error starting Flask server: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[!] An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

    print("--- Docster finished ---")