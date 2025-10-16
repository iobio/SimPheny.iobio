<template>
    <div id="nav-bar">
        <v-app-bar density="compact" color="#19354D">
            <v-btn @click="showOverlay = true" v-if="!targetPatient" variant="outlined">Add/Select Patient</v-btn>
            <v-btn @click="showOverlay = true" v-if="targetPatient" variant="outlined">Edit Patient</v-btn>
            <!-- add a triplet of radio buttons one for udn, one for orphanet, one for both -->
            <v-radio-group v-model="whichPopulationChoice" inline hide-details="true">
                <v-radio label="UDN" value="udn"></v-radio>
                <v-radio label="ClinVar" value="clinvar"></v-radio>
                <v-radio label="Orphanet" value="orpha"></v-radio>
                <v-radio label="DECIPHER" value="decipher"></v-radio>
                <v-radio label="Phenopacket Store" value="pheno"></v-radio>
            </v-radio-group>
            <v-toolbar-title>SimPheny.iobio</v-toolbar-title>
            <v-btn density="compact" icon="mdi-dots-vertical" @click="toggleShowDisclaimer"></v-btn>
        </v-app-bar>

        <v-overlay id="add-select-patient" v-model="showOverlay" persistent>
            <div id="add-select-dialog">
                <v-btn
                    class="close-button"
                    @click="showOverlay = false"
                    icon="mdi-close-circle-outline"
                    height="35px"
                    width="35px"></v-btn>
                <h3>Input Target Patient Details</h3>
                <p>Showing: {{ populationLabel }}</p>
                <div v-if="exampleIds" id="udn-id-input" class="input-container">
                    <v-autocomplete
                        v-model="udnId"
                        :items="exampleIds"
                        variant="solo-filled"
                        label="Patient/Match Code"
                        density="compact"
                        clearable
                        @update:modelValue="checkInputPatient"
                        clear-on-select></v-autocomplete>
                    <div id="custom-pt-container">
                        <label for="custom-patient">Custom Patient</label>
                        <input type="checkbox" name="custom" id="custom-patient" v-model="customPatient" />
                    </div>
                </div>

                <!-- Phenotype List Input -->
                <div class="input-container">
                    <v-textarea
                        v-model="phenotypesText"
                        variant="solo-filled"
                        label="Phenotypes"
                        density="compact"
                        no-resize
                        hint="insert comma or semi-colon separated list of phenotypes"></v-textarea>
                </div>
                <!-- variant List Input -->
                <div class="input-container">
                    <v-textarea
                        v-model="genesText"
                        variant="solo-filled"
                        label="Genes (optional)"
                        density="compact"
                        no-resize
                        hint="insert comma or semi-colon separated list of genes"></v-textarea>
                </div>
                <v-btn @click="processPatient" :disabled="phenotypesPresent">Compare Patient</v-btn>
            </div>
        </v-overlay>
        <v-overlay id="disclaimer-overlay" v-model="showDisclaimer">
            <div id="disclaimer-popup">
                <h3>Disclaimer</h3>
                <p>
                    The University of Utah makes no claims that iobio applications, including simpheny.iobio are approved for
                    clinical use. All users of iobio applications including simpheny.iobio understand and accept that any
                    information gained by using these applications, whether the information comes from visualization, processing,
                    internal or external databases, or analysis, may not in any way be used for clinical purposes. The University
                    of Utah makes no representation that iobio or simpheny.iobio is either safe or effective for any intended use
                    for which research may currently be performed.
                    <br />
                    <br />
                    Iobio, or any iobio applications ARE TO BE USED FOR RESEARCH PURPOSES ONLY. USE FOR CLINICAL PURPOSES IS
                    EXPRESSLY FORBIDDEN. Approval of iobio applications for clinical use has neither been applied for, nor
                    received, in any country, including the United States of America.
                </p>
                <v-btn @click="toggleShowDisclaimer">Close</v-btn>
            </div>
        </v-overlay>
    </div>
</template>

<script>
export default {
    name: "NavBar",
    components: {},
    props: {
        showPtSelectOverlay: Boolean,
        targetPatient: Object,
        whichPopulation: String,
    },
    data: function () {
        return {
            internalUdnPtIdsList: this.udnPatientIdsList,
            internalPatientMap: {},
            showOverlay: this.showPtSelectOverlay,
            udnId: "",
            phenotypesText: "",
            genesText: "",
            customPatient: false,
            firstLoading: true,
            whichPopulationChoice: this.whichPopulation,
            showDisclaimer: false,
            exampleIds: ["example-1", "example-2", "example-3", "example-4", "example-5", "custom"],
            examplePts: [
                {
                    id: "example-1",
                    phenotypes:
                        "HP:0000215; HP:0000316; HP:0000348; HP:0000431; HP:0000455; HP:0000483; HP:0008443; HP:0008800; HP:0010501; HP:0000565; HP:0000574; HP:0001238; HP:0100543; HP:0002141; HP:0002996; HP:0004283",
                    genes: "EHBP1L1, KIAA0513, POTEJ, ANTXRL, MUC4, NCAM2, RBMXL1, POTEF, UBE3B, PRKRA, OSBPL1A, GOLGA8R, AUTS2, ATP2B3, RGPD4, NPIPB6, ADGRA3, THAP11, OR5D3P, STAB2, SHPRH, AP3S1, COL1A2, BMP8A, GOLGA6L2, CFAP53, MRPL4",
                },
                {
                    id: "example-2",
                    phenotypes:
                        "HP:0002011; HP:0002066; HP:0002073; HP:0002406; HP:0000508; HP:0000639; HP:0000666; HP:0100275; HP:0007240; HP:0007367; HP:0007979; HP:0001251; HP:0001272; HP:0001310; HP:0001317",
                    genes: "NTN1, SLC25A28, KMT2D, HLA-DQB1, BPIFB4, RPGR, ZC3H11C, MCTP2, DCAF15, ALPG, PARVG, KIF15, ARPP21, TRRAP, MICAL1, THOC1, CENPB, HLA-B, DNAH17, PLIN4, TNFRSF10D, MIB2, PLAA, USP5, KRT6C, SYNE1, OR11H2, PRDM12, TIMP1, MUC17, ADM, GJC2, ACLY, SREBF1, SIGLEC11, FANCD2, CUX2, REM1, MYO18A, ZNF770, MUC4, GRB10, BAIAP2, NUTM2B, ABCA13, HLTF, POTEF, RIN3, PRSS2, ABCA4, HCLS1, CSNK1G3, CPB1, CEL, N4BP2, KANK4, RHOT1, CLEC18B, PSME1, UMPS, CCDC180, INO80E, DMPK, MST1, PRB3, RBMX, NR1H3, NEB, PYCR2, NRN1L, MAPK8IP1, CR1, FUT2, POLR3A, ZNF512B, PCDHB8, METTL6, BRDT, HIP1, DNPEP, CDK11A, HERC2, MED13L, GOLGA6L2, BMP8A, TDG, KCNJ18, APOA1, SH2B1, NBPF8, SCFD1, FOXD4L4, PCM1, IL32, INSR, NFIA, USP17L18, AQP12A, LILRB3, HBM, GOLGA6C, SCN11A, RASA4B, HYCC1, FMN2, IL17RB, CRISP3, CNTNAP3B, CHD3, PRDM1, DIS3L2, HR, ZNF335, VRK2, AMHR2, MLX, PEX7, TULP4, GUCY1A1, KPRP, PAGE1, MDN1, PRICKLE2, GTF2IRD2, ADAMTS18, ASAH2, FAM86B1, ANKRD30B, NKX3-1, POMT1, SLC2A1, CBARP, PRPF40B, RDH12, ANKRD36, ANO7, RHBDL2, GTF2F1, OR2T29, MUC20, ZC3H11B, CDH23, COL18A1, RGPD8, GPR162, KRTAP5-1, GLE1, PCED1A, ALDH1A3, SRCAP, ARHGEF33, MYH6, NLGN4X, MTSS2, R3HDML, APEH, MUC6, FBXO2, LTBP4, FBN3, ABCB6, ARSG, TELO2, ALPI, TBC1D2, GLB1, GOLGA8H, KMT2C",
                },
                {
                    id: "example-3",
                    phenotypes:
                        "HP:0002166; HP:0002312; HP:0002415; HP:0002600; HP:0002607; HP:0000011; HP:0000020; HP:0007002; HP:0007141; HP:0007366; HP:0010873; HP:0000648; HP:0000662; HP:0003749; HP:0003750; HP:0004466; HP:0012079; HP:0012450; HP:0025353; HP:0100014; HP:0001272; HP:0001647; HP:0002066; HP:0002136",
                    genes: "B4GALT6, SLU7, SLC24A3, TNFAIP3, FMO4, EFCAB6, ZC3H11C, POTEE, CPSF1, FSTL3, SRSF3, PROKR2, HSPG2, FBN1, CHAT, DCAF15, NPIPA8, CNTROB, ANKRD30A, DCLK1, VCPKMT, ZFYVE16, TARS1, PUM2, SELENOW, TMUB1, TSPAN9, PEX5, KCNMA1, HEATR3, COL8A1, CYP26C1, KRT6C, SYNE1, OR2T8, ZNG1E, KCNH1, HFE, SORD, RGPD3, POLR2M, CLTC, SRRM5, FAM86B2, CALR, NOX1, POTEJ, PHKA2, COL4A1, BAIAP2, AMPD3, DYSF, WDR35, VPS33A, PRAMEF6, WDR27, GOLGA6L6, MTCH2, PRAMEF13, ZNF75D, POTEF, TBC1D28, THOC3, ABCA4, TRIM64B, NBPF20, TRIO, CCT4, POM121C, HOOK3, FOXP4, POTEI, PCDHB10, CEL, AGAP9, SPDYE9, MAP3K7, DGKD, ZNF18, RXFP4, SP140, TLDC2, ARHGEF5, RBMX, PRKG2, NEB, GOLGA8K, OXA1L, CFAP58, ARHGEF19, FRG2C, SPANXC, SPEG, ARHGAP39, SPTBN4, GPC5, BMP8A, CFTR, GBE1, PABPC3, GOLGA6L2, SLC45A1, LRP5, NAMPT, NBPF10, KCNJ18, MAPK8IP3, RCN3, RANBP2, NBPF8, ASAH2B, MT-ND5, TPH1, FOXD4L4, FOXRED2, GJB2, FAM186A, OR2T35, RECQL, SLC5A7, CNOT8, SHROOM4, NFIA, GLMN, MFHAS1, MYBPC3, SUCLG2, GOLGA6C, POU3F4, RECQL4, USP28, EIF4G3, ZNF362, CNTNAP3B, FANK1, DNAH7, TYRO3, POR, SPDYE6, MACF1, SECISBP2, INO80, RYR1, ZNF292, PRSS57, RASA4, PRAMEF9, TBC1D23, KRTAP5-10, NOS3, FAT4, PCSK5, MDN1, SPRR3, GRM6, ERBB2, MSL3, PCDHA4, ARMCX3, FAM86B1, TMPRSS11B, UBR4, SLC9B1, MRPS27, C16orf74, ARHGEF28, FGFBP2, SPAG6, LPO, JAG1, CREBBP, CROCC2, ANKRD36, UNC5B, PDGFB, NCF4, ZC3H11B, FBXL6, NXF2, GOLGA6B, SPTA1, RGPD8, ANP32E, GPRASP2, NBPF12, SMG1, ZNF880, NPY4R2, PCED1A, SLC4A2, ZNF687, CELSR3, COPA, ABCA3, TBR1, CPNE9, SPDYE12, CNTNAP3, TTN, ITPKB, PKP2, HS3ST2, ANKRD20A1, PPARGC1A, APEH, CCSAP, ZNF467, VCX, DRC3, GRAMD4, GLDC, CNGB1, NT5DC1, FOXD4L3, MRPL4, ESRRA, BAIAP2L2",
                },
                {
                    id: "example-4",
                    phenotypes:
                        "HP:0100807; HP:0100864; HP:0007200; HP:0007340; HP:0008081; HP:0008093; HP:0008762; HP:0008804; HP:0010628; HP:0010808; HP:0010864; HP:0011203; HP:0000648; HP:0000766; HP:0000925; HP:0000938; HP:0001155; HP:0001191; HP:0001239; HP:0002991; HP:0003083; HP:0003119; HP:0003182; HP:0003207; HP:0003319; HP:0003368; HP:0003396; HP:0003487; HP:0004269; HP:0004322; HP:0004325; HP:0004348; HP:0005743; HP:0005876; HP:0005916; HP:0005978; HP:0006149; HP:0001629; HP:0001631; HP:0001639; HP:0001643; HP:0001647; HP:0001655; HP:0001659; HP:0001717; HP:0001760; HP:0001763; HP:0001999; HP:0002069; HP:0002121; HP:0001263; HP:0001288; HP:0001382; HP:0000179; HP:0000232; HP:0000252; HP:0000270; HP:0000275; HP:0000276; HP:0000280; HP:0000403; HP:0000410; HP:0000411; HP:0000505; HP:0011917; HP:0012203; HP:0100009; HP:0002144; HP:0002360; HP:0002395; HP:0002650; HP:0002652; HP:0002659; HP:0002758; HP:0002817",
                    genes: "WDFY4, SLC6A8, MUC4, TRAF7, SIRT6, PLA2G4E, KRTAP5-5, PRDM15, ADCY8, NTN4, PRPF40B, KDM6B, PRKRA, INTS11, PCNT, IL3RA, NFIA, ZC3H11B, TMEM185A, CNTN5, PTPN21, VPS13B, SYNE1, TRIM49, SCML2, IGBP1, TTC28, MID1, RERE, CCL25, ANTXR2, SETBP1, SOWAHD, BRCA2",
                },
                {
                    id: "example-5",
                    phenotypes:
                        "HP:0002072; HP:0002078; HP:0003808; HP:0005988; HP:0002355; HP:0002474; HP:0002548; HP:0001257; HP:0001263; HP:0001332; HP:0001357; HP:0001508; HP:0012450; HP:0000252; HP:0000490; HP:0000506; HP:0000565; HP:0000639; HP:0000646; HP:0000750; HP:0000964; HP:0100559",
                    genes: "POTEJ, PPP1R7, ZC3H11C, MTCH2, PHGR1, RIN3, SERHL2, ATP8B3, LAT2, UBA5, NXNL1, RECQL4, RGPD8, SPTB, RIMBP3, DGKQ, PWWP4, GOLGA8K, TTN, RASA4, FRMPD2, VCX3B, PRAMEF9, GOLGA6A, BMP8A, MAGEC1",
                },
            ],
        };
    },
    mounted: function () {
        if (!this.targetPatient) {
            this.udnId = "example-1";
        } else {
            this.udnId = "custom";
            this.phenotypesText = this.targetPatient.phenotypeList
                .map((phenotype) => {
                    return phenotype.hpoId;
                })
                .join("; ");
            this.genesText = this.targetPatient.genesList
                .map((gene) => {
                    return gene.gene_symbol;
                })
                .join("; ");
            
            this.customPatient = true;
        }
    },
    methods: {
        toggleShowDisclaimer() {
            this.showDisclaimer = !this.showDisclaimer;
        },
        patientChanged() {
            // If the patient id is in the customExamplesIds list, set the phenotypes and genes text to the corresponding values
            if (this.exampleIds.includes(this.udnId)) {
                let examplePt = this.examplePts.find((example) => example.id === this.udnId);
                if (examplePt) {
                    this.phenotypesText = examplePt.phenotypes;
                    this.genesText = examplePt.genes;
                } else {
                    this.phenotypesText = "";
                    this.genesText = "";
                }
                return;
            }
        },
        async processPatient() {
            //Set the target id
            let targetId = this.udnId;

            //Make the targetPhenotypes list
            //take off any trailing or leading spaces or ; or , and split on the remaining either , or ;

            let phenotypes = this.phenotypesText.split(/[,;]+/).map((phenotype) => {
                return phenotype.trim().toUpperCase();
            });

            if (phenotypes[phenotypes.length - 1] === "") {
                phenotypes.pop();
            }

            //Make the targetGenes list
            let genes = this.genesText.split(/[,;]+/).map((gene) => {
                return gene.trim().toUpperCase();
            });

            if (genes[genes.length - 1] === "") {
                genes.pop();
            }

            //set the target patient
            this.$emit("set-target-patient", targetId, phenotypes, genes);
            this.$emit("set-mosaic-false");

            //close the overlay
            this.showOverlay = false;
        },
        checkInputPatient() {
            if (this.udnId == null || this.udnId == "" || this.udnId == undefined) {
                this.customPatient = true;
                this.udnId = "custom";
            } else {
                this.customPatient = false;
            }
        },
    },
    computed: {
        phenotypesPresent() {
            if (this.phenotypesText == null || this.phenotypesText == "" || this.phenotypesText == undefined) {
                return true;
            } else {
                return false;
            }
        },
        populationLabel() {
            if (this.whichPopulationChoice === "udn") {
                return "UDN";
            } else if (this.whichPopulationChoice === "clinvar") {
                return "ClinVar";
            } else if (this.whichPopulationChoice === "orpha") {
                return "Orphanet";
            } else if (this.whichPopulationChoice === "decipher") {
                return "Decipher";
            }
        },
    },
    watch: {
        udnId: function (newVal, oldVal) {
            if (newVal === "custom" && this.customPatient === true) {
                return;
            }
            this.patientChanged();
        },
        showPtSelectOverlay: function (newVal, oldVal) {
            this.showOverlay = newVal;
        },
        targetPatient: {
            handler: function (newVal, oldVal) {
                if (newVal) {
                    this.udnId = newVal.id;
                    this.phenotypesText = newVal.phenotypeList
                        .map((phenotype) => {
                            return phenotype.hpoId;
                        })
                        .join("; ");
                    this.genesText = newVal.genesList
                        .map((gene) => {
                            return gene.gene_symbol;
                        })
                        .join("; ");
                }
            },
            deep: true,
        },
        customPatient(newVal) {
            if (newVal === true && this.udnId === "custom") {
                return;
            }

            if (newVal == true) {
                this.udnId = "custom";
                this.phenotypesText = "";
                this.genesText = "";
            } else {
                this.udnId = this.internalUdnPtIdsList[0];
                this.patientChanged();
            }
        },
        whichPopulationChoice(newVal, oldVal) {
            this.$emit("updatePopulationChoice", newVal);
        },
        phenotypesText(newVal, oldVal) {
            if (this.udnId !== "custom" && this.internalPatientMap[this.udnId]) {
                if (this.internalPatientMap[this.udnId].Terms && typeof this.internalPatientMap[this.udnId].Terms === "string") {
                    let phenotypesText = this.internalPatientMap[String(this.udnId)].Terms.replace(/\[|\]|\'|\"/g, "")
                        .replace(/\s+/g, " ")
                        .replace(/\s+,/g, "")
                        .replace(/,/g, ";");
                    if (newVal !== phenotypesText) {
                        this.udnId = "custom";
                        this.customPatient = true;
                    }
                } else {
                    //Typical case
                    let phenotypesText = this.internalPatientMap[String(this.udnId)].phenotypeList
                        .map((phenotype) => {
                            return phenotype.hpoId;
                        })
                        .join("; ");
                    if (newVal !== phenotypesText) {
                        this.udnId = "custom";
                        this.customPatient = true;
                    }
                }
            }
        },
        genesText(newVal, oldVal) {
            //get the selected patient if it is not custom
            if (this.udnId !== "custom" && this.internalPatientMap[this.udnId]) {
                if (this.internalPatientMap[this.udnId].Terms && typeof this.internalPatientMap[this.udnId].Terms === "string") {
                    let genesText = this.internalPatientMap[String(this.udnId)].Genes.replace(/\[|\]|\'|\"/g, "")
                        .replace(/\s+/g, " ")
                        .replace(/\s,/g, "")
                        .replace(/,/g, ";");
                    if (newVal !== genesText) {
                        this.udnId = "custom";
                        this.customPatient = true;
                    }
                } else {
                    //Typical case
                    let genesText = this.internalPatientMap[String(this.udnId)].genesList
                        .map((gene) => {
                            return gene.gene_symbol;
                        })
                        .join("; ");
                    if (newVal !== genesText) {
                        this.udnId = "custom";
                        this.customPatient = true;
                    }
                }
            }
        },
    },
};
</script>

<style lang="sass">
#nav-bar
    .v-toolbar__content
        .v-toolbar-title
            text-align: end
            font-weight: bolder
            padding-right: 20px
.v-overlay-container
    .v-overlay#disclaimer-overlay
        width: 100%
        height: 100%
        display: flex
        flex-direction: column
        justify-content: center
        align-items: center
        #disclaimer-popup
            padding: 20px
            background-color: white
            display: flex
            flex-direction: column
            justify-content: center
            align-items: start
            width: 50vw
            min-height: 50vh
            border-radius: 5px
            position: relative
            h3
                width: 100%
                text-align: center
                margin-bottom: 20px
            .v-btn
                background-color: #2E5F8A
                color: white
                &.close-button
                    background-color: red
                    color: white
                    position: absolute
                    top: 10px
                    right: 10px
            p
                width: 100%
                text-align: justify
                margin-bottom: 20px
    .v-overlay#add-select-patient
        width: 100%
        height: 100%
        display: flex
        flex-direction: column
        justify-content: center
        align-items: center
        #add-select-dialog
            padding: 20px
            background-color: white
            display: flex
            flex-direction: column
            justify-content: center
            align-items: start
            width: 50vw
            min-height: 50vh
            border-radius: 5px
            position: relative
            h3
                width: 100%
                text-align: center
                margin-bottom: 20px
            .v-btn
                background-color: #2E5F8A
                color: white
                &.close-button
                    background-color: red
                    color: white
                    position: absolute
                    top: 10px
                    right: 10px
            .input-container
                width: 100%
                display: flex
                flex-direction: row
                justify-content: center
            #udn-id-input.input-container
                width: 70%
                #custom-pt-container
                    display: flex
                    flex-direction: column
                    justify-content: flex-start
                    align-items: center
                    margin-left: 20px
                    background-color: #f6f6f6 //this is the approximate color of the other vuetify inputs
                    padding: 5px
                    border-radius: 5px
                    margin-bottom: 22px
                    box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)
                    label
                        font-size: 12px
                        color: gray
</style>
