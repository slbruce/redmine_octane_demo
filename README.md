# Demo Injector from Redmine to ALM Octane

This tool demonstrates reading the Redmine API and injecting Octane with the correct entities.

For Redmine's REST API see: http://www.redmine.org/projects/redmine/wiki/Rest_api
For ALM Octane's Node.js SDK see: https://github.com/MicroFocus/alm-octane-js-rest-sdk

## Pre-requisites and Installation

Node.js needs to be installed (8.9.1+)  

## ALM Octane Preparation

Need to add a UDF to both feature and defect entity.  UDF name `redmine_id_udf` which contains the original Redmine entity id

## Tool Preparation

1. Under the root of the tool directory there is a sample configuration file `config-sample.json`.  Copy this file to a new file `config.json`.  There are a number of configurations that need to be set here:
       
    `redmine`: Enter the correct settings for Redmine
    
    `octane`: Enter the correct settings for Octane
    
2. In the root of the project run the following commands:

```
    npm install
    npm setup
```  

## Running the Tool

Use the following command to run the tool:

```
    npm start
```