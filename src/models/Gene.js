//Will be a class with a name for now to just represent the variant gene name

class Gene {
    constructor(gene_id=null, gene_symbol=null) {
        this.gene_id = gene_id;
        this.gene_symbol = gene_symbol;
        this.relevant = true;
    }
    getGeneId() {
        return this.gene_id;
    }
    getGeneSymbol() {
        return this.gene_symbol;
    }
    setGeneId(id) {
        this.gene_id = id;
    }
    setGeneSymbol(symbol) {
        this.gene_symbol = symbol;
    }
}
export default Gene;