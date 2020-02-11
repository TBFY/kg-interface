# kg-interface
A query interface for the knowledge graph based on a light version of OptiqueVQS. The full version with a backend allowing among others storing and retriving queries is available here:  [https://sws.ifi.uio.no/project/optique-vqs/](https://sws.ifi.uio.no/project/optique-vqs/).

OptiqueVQS enables end users with no technical background and skills to transform their information needs into SPARQL queries visually. It follows an approach projecting ontologies into graphs in order for end users to navigate a given ontology for formulating SPARQL queries. OptiqueVQS and ontology-projection approach have been described here:

- Ahmet Soylu and Evgeny Kharlamov, "Making Complex Ontologies End User Accessible via Ontology Projections", in Proceedings of the 8th Joint International Conference (JIST 2018), LNCS, Vol. 11341, Springer, 2018, pp.295-303. doi: [10.1007/978-3-030-04284-4_20](https://doi.org/10.1007/978-3-030-04284-4_20)


## Quick Start
This version of the OptiqueVQS is purely client-side. You need to set the following parameters in config.js under the config folder. 

- config.sparqlBase = "The SPARQL query end-point for the ontology (T-box only)";
- config.resultBase = "The SPARQL query end-point for the triple store (A-box only)";
- config.externalBase = "The SPARQL end-user interface for the triple store";
- config.resourceBase = "The resource view end-user interface for the triple store";

