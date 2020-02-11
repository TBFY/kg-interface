# kg-interface
A query interface for the knowledge graph based on a light version of OptiqueVQS.

## Quick Start
This version of the OptiqueVQS is purely client-side. You need to set the following parameters in config.js under the config folder. 

config.sparqlBase = "The SPARQL query end-point for the ontology (T-box only)"
config.resultBase = "The SPARQL query end-point for the triple store (A-box only)";
config.externalBase = "The SPARQL end-user interface for the triple store";
config.resourceBase = "The resource view end-user interface for the triple store"

