# SimPheny.iobio

Visit and demo/use here: [SimPheny.iobio](https://mosaic-staging.chpc.utah.edu/phenomatcher-frontend/)

## Overview

SimPheny.iobio is a real time **web application** for exploring phenotypic similarity between individuals from multiple populations  The application uses a combination of phenotype matching algorithms and visualization techniques to help users identify individuals with similar phenotypes. The application is designed to be used by clinicians & researchers to explore phenotypic similarity between individuals and to help interrogate undiagnosed cases of suspected genetic origin.

<img width="1396" alt="Screenshot 2024-05-03 at 11 35 31 AM" src="https://github.com/iobio/SimPheny.iobio/assets/45885321/72e8c7f9-9d3f-4f83-9829-0b7dbe7d9a70">

## Features

### Bring Your Own Case

Users can input a list of phenotypes for an individual and the application will return a list of individuals with similar phenotypes in a visual representation.

<img width="1402" alt="Screenshot 2024-05-03 at 11 39 25 AM" src="https://github.com/iobio/SimPheny.iobio/assets/45885321/d03ff105-d1c9-4acf-b7f1-7768dccc7741">

**ADD/SELECT PATIENT** & **EDIT PATIENT** Will open a patient chooser/input dialog.

<img width="717" alt="Screenshot 2024-05-03 at 11 38 44 AM" src="https://github.com/iobio/SimPheny.iobio/assets/45885321/1715d20a-647f-4dc0-9e74-6c36cf5e9c54">

### Explore Available Cases

Additionally, users can explore cases from the available populations by selecting a case from the list of available cases within the patient chooser/input dialog.

<img width="714" alt="Screenshot 2024-05-03 at 11 52 19 AM" src="https://github.com/iobio/SimPheny.iobio/assets/45885321/64704eb9-0791-49e4-ae8b-fb61325a2526">

### Multiple Populations

Currently the application uses publically avaible information and supports comparison of phenotypes between individuals from the following populations:

- UDN: diagnosed cases such as those available through other sources see [clinvar's submitted cases](https://www.ncbi.nlm.nih.gov/clinvar/?LinkName=orgtrack_clinvar&from_uid=505999) for more details
- Orphanet Disease Listings

Comparrison populations can be chosen from the radio selections on the upper bar.

<img width="1402" alt="Screenshot 2024-05-03 at 11 44 34 AM" src="https://github.com/iobio/SimPheny.iobio/assets/45885321/dc90e930-4361-4d42-b64b-54b4058a6211">

After comparrison populations can be filtered on or off of the chart via the chart filter options.

<img width="279" alt="Screenshot 2024-05-03 at 11 45 19 AM" src="https://github.com/iobio/SimPheny.iobio/assets/45885321/a94f0356-170c-4e1c-ba08-070ad4b862c2">


