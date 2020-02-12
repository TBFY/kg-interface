<p align="center"><img width=50% src="https://github.com/TBFY/general/blob/master/figures/tbfy-logo.png"></p>
<p align="center"><img width=40% src="https://github.com/TBFY/kg-interface/blob/master/logo.png"></p>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![Java](https://img.shields.io/badge/java-v1.8+-blue.svg)
[![Build Status](https://travis-ci.org/TBFY/knowledge-graph.svg?branch=master)](https://travis-ci.org/TBFY/knowledge-graph)
[![](https://jitpack.io/v/TBFY/knowledge-graph.svg)](https://jitpack.io/#TBFY/knowledge-graph)
[![GitHub Issues](https://img.shields.io/github/issues/TBFY/knowledge-graph-API.svg)](https://github.com/TBFY/knowledge-graph/issues)
[![License](https://img.shields.io/badge/license-Apache2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![DOI](https://zenodo.org/badge/123939667.svg)](https://zenodo.org/badge/latestdoi/123939667)

# kg-interface
A query interface for the knowledge graph based on a light version of OptiqueVQS. The full version with a backend allowing among others storing and retriving queries is available here:  [https://sws.ifi.uio.no/project/optique-vqs/](https://sws.ifi.uio.no/project/optique-vqs/).

OptiqueVQS enables end users with no technical background and skills to transform their information needs into SPARQL queries visually. It follows an approach projecting ontologies into graphs in order for end users to navigate a given ontology for formulating SPARQL queries. OptiqueVQS and ontology-projection approach have been described here:

- Ahmet Soylu and Evgeny Kharlamov, "Making Complex Ontologies End User Accessible via Ontology Projections", in Proceedings of the 8th Joint International Conference (JIST 2018), LNCS, Vol. 11341, Springer, 2018, pp.295-303. doi: [10.1007/978-3-030-04284-4_20](https://doi.org/10.1007/978-3-030-04284-4_20)
- Ahmet Soylu, Evgeny Kharlamov, Dmitriy Zheleznyakov, Ernesto Jiménez-Ruiz, Martin Giese, Martin G. Skjæveland, Dag Hovland, Rudolf Schlatte, Sebastian Brandt, Hallstein Lie, Ian Horrocks, "OptiqueVQS: A visual query system over ontologies for industry", Semantic Web 9(5) (2018), 627-660. doi: [10.3233/SW-180293](https://doi.org/10.3233/SW-180293)


## Quick Start
This version of the OptiqueVQS is purely client-side. You need to set the following parameters in config.js under the config folder. 

- config.sparqlBase = "The SPARQL query end-point for the ontology (T-box only)";
- config.resultBase = "The SPARQL query end-point for the triple store (A-box only)";
- config.externalBase = "The SPARQL end-user interface for the triple store";
- config.resourceBase = "The resource view end-user interface for the triple store";

