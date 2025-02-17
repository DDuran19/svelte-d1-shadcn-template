import os
import re

def remove_imports_and_comments(code):
    """
    Remove import/export statements and comments from TypeScript code.
    """
    # Remove single-line comments (// ...)
    code = re.sub(r'//.*', '', code)
    
    # Remove multi-line comments (/* ... */)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    # Remove import/export statements
    code = re.sub(r'^(import|export)\s+.*;', '', code, flags=re.MULTILINE)
    
    return code.strip()

def minify_code(code):
    """
    Minify TypeScript code by removing unnecessary whitespace and new lines.
    """
    code = re.sub(r'\s+', ' ', code)  # Replace multiple spaces/newlines with a single space
    code = re.sub(r'\s*([{};(),])\s*', r'\1', code)  # Remove spaces around common syntax characters
    return code.strip()

def collect_typescript_files(folder_path, output_file):
    """
    Recursively scans a folder, reads all TypeScript (.ts) files,
    removes import/export statements and comments, minifies them, then compiles them into one file.
    """
    collected_code = []
    
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".ts"):  # Only process TypeScript files
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        code = f.read()
                        cleaned_code = remove_imports_and_comments(code)
                        minified_code = minify_code(cleaned_code)
                        collected_code.append(f"// --- {file_path} ---\n" + minified_code + "\n\n")
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    # Save to output file
    with open(output_file, "w", encoding="utf-8") as out_f:
        out_f.write("\n".join(collected_code))
    
    print(f"Collected TypeScript code saved to {output_file}")


# Usage example
if __name__ == "__main__":
    folder_to_scan = "./src/lib/server/database/d1"  
    output_file = "compiled_typescript.txt"
    collect_typescript_files(folder_to_scan, output_file)
