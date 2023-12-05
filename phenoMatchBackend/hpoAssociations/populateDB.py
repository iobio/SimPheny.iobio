import sqlite3
import json

genes_to_diseases_url = 'genes_to_disease.txt'
genes_to_phenotypes_url = 'genes_to_phenotype.txt'

genes_to_diseases = []
genes_to_phenotypes = []

genes = []
diseases = []

# Function takes a url and returns a list of dictionaries where the first row is all of the keys and the rest of the rows are the corresponding values but for the first column the value is truncated removing the prefix 'NCBIGene:'
def url_to_dict_g2d(url):
    with open(url) as f:
        data = f.readlines()
    data = [x.strip() for x in data]
    keys = data[0].split('\t')
    values = [x.split('\t') for x in data[1:]]

    for row in values:
        row[0] = row[0][9:]
    return [dict(zip(keys, x)) for x in values]

# Function takes a url and returns a list of dictionaries where the first row is all of the keys and the rest of the rows are the corresponding values
def url_to_dict_g2p(url):
    with open(url) as f:
        data = f.readlines()
    data = [x.strip() for x in data]
    keys = data[0].split('\t')
    values = [x.split('\t') for x in data[1:]]
    return [dict(zip(keys, x)) for x in values]

# Function takes a url and uses the first two columns to create a list of tuples where the first element is the gene_id and the second is the gene_symbol
def url_to_list_genes(url):
    with open(url) as f:
        data = f.readlines()
    data = [x.strip() for x in data]
    values = [x.split('\t') for x in data[1:]]
    return [(x[0], x[1]) for x in values]

#Function takes a url and uses the last two columns to create a list of tuples where the second to last element is the disease_id and the last is the source
def url_to_list_diseases(url):
    with open(url) as f:
        data = f.readlines()
    data = [x.strip() for x in data]
    values = [x.split('\t') for x in data[1:]]
    return [(x[-2], x[-1]) for x in values]

genes_to_diseases = url_to_dict_g2d(genes_to_diseases_url)
genes_to_phenotypes = url_to_dict_g2p(genes_to_phenotypes_url)
genes = url_to_list_genes(genes_to_phenotypes_url)
#remove any duplicate gene tuples
genes = list(set(genes))
diseases = url_to_list_diseases(genes_to_diseases_url)
#remove any duplicate disease tuples
diseases = list(set(diseases))

# Deserialize JSON
with open('hpoTerms.json') as f:
    data = json.load(f)

# Connect to SQLite
conn = sqlite3.connect('hpo.db')
c = conn.cursor()

#drop tables if any exist
c.executescript('''
    DROP TABLE IF EXISTS Terms;
    DROP TABLE IF EXISTS Genes;
    DROP TABLE IF EXISTS Diseases;
    DROP TABLE IF EXISTS term_to_gene;
    DROP TABLE IF EXISTS gene_to_disease;
''')

# Create table and index
c.executescript('''
    CREATE TABLE Terms (
        term_id TEXT PRIMARY KEY,
        name TEXT,
        definition TEXT,
        comment TEXT,
        synonyms TEXT
    );
    CREATE INDEX idx_name ON Terms(name);
''')

# Create table and index
c.executescript('''
    CREATE TABLE Genes (
        gene_id TEXT PRIMARY KEY,
        gene_symbol TEXT
    );
    CREATE INDEX idx_gene_symbol ON Genes(gene_symbol);
''')

# Create table and index
c.executescript('''
    CREATE TABLE Diseases (
        disease_id TEXT PRIMARY KEY,
        source TEXT
    );
''')

# Create a table term_to_gene with foreign keys to Terms and Genes and an attribute frequency
c.executescript('''
    CREATE TABLE term_to_gene (
        term_id TEXT,
        gene_id TEXT,
        frequency TEXT,
        disease_id TEXT,
        FOREIGN KEY (term_id) REFERENCES Terms(term_id),
        FOREIGN KEY (gene_id) REFERENCES Genes(gene_id), 
        FOREIGN KEY (disease_id) REFERENCES Diseases(disease_id)
    );
''')

#Create a table gene_to_disease with foreign keys to Genes and Diseases and an attribute association_type
c.executescript('''
    CREATE TABLE gene_to_disease (
        gene_id TEXT,
        disease_id TEXT,
        association_type TEXT,
        FOREIGN KEY (gene_id) REFERENCES Genes(gene_id),
        FOREIGN KEY (disease_id) REFERENCES Diseases(disease_id)
    );
''')

# Insert data into terms table
for item in data:
    c.execute('''
        INSERT INTO Terms (term_id, name, definition, comment, synonyms)
        VALUES (?, ?, ?, ?, ?)
    ''', (item['id'], item['name'], item['definition'], item['comment'], ','.join(item['synonyms'])))

# Insert data into genes table from genes list of tuples
for item in genes:
    c.execute('''
        INSERT INTO Genes (gene_id, gene_symbol)
        VALUES (?, ?)
    ''', (item[0], item[1]))

# Insert data into diseases table from diseases list of tuples
for item in diseases:
    c.execute('''
        INSERT INTO Diseases (disease_id, source)
        VALUES (?, ?)
    ''', (item[0], item[1]))

# Insert data into term_to_gene table from genes_to_phenotypes list of dictionaries
for item in genes_to_phenotypes:
    c.execute('''
        INSERT INTO term_to_gene (term_id, gene_id, frequency, disease_id)
        VALUES (?, ?, ?, ?)
    ''', (item['hpo_id'], item['ncbi_gene_id'], item['frequency'], item['disease_id']))

# Insert data into gene_to_disease table from genes_to_diseases list of dictionaries
for item in genes_to_diseases:
    c.execute('''
        INSERT INTO gene_to_disease (gene_id, disease_id, association_type)
        VALUES (?, ?, ?)
    ''', (item['ncbi_gene_id'], item['disease_id'], item['association_type']))

# Commit and close
conn.commit()
conn.close()