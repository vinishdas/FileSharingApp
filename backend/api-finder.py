import re
import sys

def find_api_endpoints(file_path):
    """Scans a single file for API endpoints and their HTTP methods."""

    # Updated regex to capture both method (GET, POST, PUT, DELETE) and endpoint
    api_regex = re.compile(
        r'(?:(?:fetch|axios\.(get|post|put|delete)|requests\.(get|post|put|delete)|app\.(get|post|put|delete))\s*\(\s*["\']([^"\']+)["\'])',
        re.IGNORECASE
    )

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        matches = api_regex.findall(content)
        
        if matches:
            print("\n🔍 **Found API Endpoints:**\n")
            for match in set(matches):
                method, endpoint = match[0] or match[1] or match[2], match[3]
                print(f"📌 {method.upper()} → {endpoint}")
        else:
            print("✅ No API endpoints found in this file.")

    except FileNotFoundError:
        print(f"❌ Error: File '{file_path}' not found.")
    except Exception as e:
        print(f"⚠️ An error occurred: {e}")

# ✅ Run script from the command line
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python api_finder.py <file_path>")
    else:
        find_api_endpoints(sys.argv[1])
