import requests
import json

response = requests.get('https://ontology.jax.org/api/hp/terms')

# Check for a valid response
if response.status_code == 200:
    data = response.json()
    # Write to a file
    with open('hpoTerms.json', 'w') as f:
        json.dump(data, f, indent=4)
else:
    print(f'Failed to retrieve data: {response.status_code}')