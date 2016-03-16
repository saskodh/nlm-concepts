This project is POC(proof-of-concept) for building a tool similar to [NLM Medical Text Indexer](http://ii.nlm.nih.gov/MTI/) (MTI).

Mockup: 
![Mock Up MeSH 3_1.png](https://bitbucket.org/repo/GbRLzp/images/3770087224-Mock%20Up%20MeSH%203_1.png)

### Project prerequisites ###

* Maven 3.3.1
* Java 1.8.0_72

### Steps for running the project ###

* mvn install 
* java -jar target/nlm-concepts-0.1.0.jar

### Steps for deploying ###

* mvn package && java -jar target/nlm-concepts-0.1.0.jar

### Configuration ###
NLM CAS credentials need to be provided on runtime [TBD]

### Contact ###
Sashe Klechkovski
sasko_dh@hotmail.com