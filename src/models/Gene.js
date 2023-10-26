//Will be a class with a name for now to just represent the variant gene name

class Gene {
    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }
    setName(name) {
        this.name = name;
    }
}
export default Gene;