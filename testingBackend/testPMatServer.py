from http.server import SimpleHTTPRequestHandler, HTTPServer
from urllib.parse import unquote
import sqlite3
import json

def fetch_to_dict(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [description[0] for description in cursor.description]
    return dict(zip(columns, row))

def fetch_to_dict_list(cursor):
    rows = cursor.fetchall()
    if rows is None:
        return None
    columns = [description[0] for description in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

def setHeaders(self):
    self.send_response(200)
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Content-type', 'application/json')
    self.end_headers()


class reqHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        #if we are at the root just show basic message
        if self.path == '/':
            setHeaders(self)
            self.wfile.write(b'Pheno-Matcher-Stage Running!')
            return
        # 
        #           Get items using the id routes
        #
        if self.path.startswith('/id/getGenes/'):
            term_id = unquote(self.path.split('/')[-1])
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("""SELECT term_to_gene.*, genes.gene_symbol 
                FROM term_to_gene 
                LEFT JOIN genes ON term_to_gene.gene_id = genes.gene_id 
                WHERE term_to_gene.term_id=?""", (term_id,))
            res = fetch_to_dict_list(c)
            conn.close()


            setHeaders(self)
            self.wfile.write(json.dumps(res).encode())

        elif self.path.startswith('/id/'):
            term_id = unquote(self.path.split('/')[-1])
            term_id = str(term_id.replace(' ', ''))
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("SELECT * FROM Terms WHERE term_id=?", (term_id,))
            res = fetch_to_dict(c)
            conn.close()

            setHeaders(self)
            self.wfile.write(json.dumps(res).encode())

        # 
        #           Get items using the hpo term name routes
        #
        if self.path.startswith('/name/'):
            term_name = unquote(self.path.split('/')[-1])
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("SELECT * FROM Terms WHERE name COLLATE NOCASE LIKE ?", (term_name,))
            res = fetch_to_dict(c)
            conn.close()

            setHeaders(self)    
            self.wfile.write(json.dumps(res).encode())

        # 
        #           Get items using the gene id routes
        #
        if self.path.startswith('/gene/getPhenotypes/'):
            gene_id = unquote(self.path.split('/')[-1])
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("""SELECT term_to_gene.*, terms.name
                FROM term_to_gene
                LEFT JOIN terms ON term_to_gene.term_id = terms.term_id
                WHERE term_to_gene.gene_id=?""", (gene_id,))
            res = fetch_to_dict_list(c)
            conn.close()

            setHeaders(self)
            self.wfile.write(json.dumps(res).encode())

        elif self.path.startswith('/gene/getDiseases/'):
            gene_id = unquote(self.path.split('/')[-1])
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("SELECT * FROM disease_to_gene WHERE gene_id=?", (gene_id,))
            res = fetch_to_dict_list(c)
            conn.close()

            setHeaders(self)        
            self.wfile.write(json.dumps(res).encode()) 

        elif self.path.startswith('/gene/id/'):
            gene_id = unquote(self.path.split('/')[-1])
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("SELECT * FROM Genes WHERE gene_id=?", (gene_id,))
            res = fetch_to_dict(c)
            conn.close()

            setHeaders(self)
            self.wfile.write(json.dumps(res).encode())

        elif self.path.startswith('/gene/name/'):
            gene_symbol = unquote(self.path.split('/')[-1])
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("SELECT * FROM Genes WHERE gene_symbol=?", (gene_symbol,))
            res = fetch_to_dict(c)
            conn.close()

            setHeaders(self)
            self.wfile.write(json.dumps(res).encode())

        elif self.path.startswith('/gene/names/'):
            # Split the path and decode the part that contains the gene names
            gene_names = unquote(self.path.split('/')[-1])
            # Expecting gene names to be separated by a comma
            gene_names_list = gene_names.split(',')

            # Create placeholders for each gene name for use in the IN clause
            placeholders = ','.join('?' for _ in gene_names_list)

            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            # Construct the query string with the correct number of placeholders
            query = "SELECT * FROM Genes WHERE gene_symbol IN ({})".format(placeholders)
            # Execute the query with the list of gene names
            c.execute(query, gene_names_list)
            res = fetch_to_dict_list(c)
            conn.close()

            setHeaders(self)
            self.wfile.write(json.dumps(res).encode()) 

        #
        # Pull all hpoTerms to populate the hpo to phenotype name mapping
        #
        if self.path.startswith('/all/hpoTerms/'):
            conn = sqlite3.connect('hpo.db')
            c = conn.cursor()
            c.execute("SELECT * FROM Terms")
            rows = c.fetchall()
            conn.close()
            res = {row[0]: {'name': row[1], 'definition': row[2], 'comment': row[3], 'synonyms': row[4]} for row in rows}

            setHeaders(self)
            self.wfile.write(json.dumps(res).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8911), reqHandler)
    server.serve_forever()