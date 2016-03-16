package com.sklechko.nlmconcepts.services;

import gov.nih.nlm.nls.skr.GenericObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;

import static com.sklechko.nlmconcepts.utils.FileUtil.writeStringToFile;

/**
 * Web API MetaMap service implementation.
 */
@Service
public class MtiServiceWebApiImpl implements MtiService {

    Logger logger = LoggerFactory.getLogger(MtiServiceWebApiImpl.class);

    @Value("${nlm.cas.email}")
    private String metaMapEmail;

    @Value("${nlm.cas.username}")
    private String metaMapUsername;

    @Value("${nlm.cas.password}")
    private String metaMapPassword;

    @Value("${nlm.batch.command}")
    private String batchCommand;

    @Override
    public String getReferencedConcepts(String textContent) {
        logger.debug("Creating temporary file.");
        File tempFile = writeStringToFile(textContent);
        logger.debug("Temporary file created. Path: '{}'", tempFile.getPath());

        String results = submitFileForProcessing(tempFile);

        logger.debug("Clean-up temp file after successful processing.");
        tempFile.delete();

        return results;
    }

    @Override
    public String getReferencedConcepts(File textFile) {
        return submitFileForProcessing(textFile);
    }

    private String submitFileForProcessing(File textFile) {
        // todo check if validation needed
        GenericObject myGenericObj = new GenericObject(metaMapUsername, metaMapPassword);
        logger.debug("Logging to NLM CAS successful.");

        myGenericObj.setField("Email_Address", metaMapEmail);
        myGenericObj.setFileField("UpLoad_File", textFile.getPath());
        myGenericObj.setField("Batch_Command", batchCommand);
        myGenericObj.setField("SilentEmail", true);

        logger.debug("Submitting text content for processing with '{}'.", batchCommand);
        return myGenericObj.handleSubmission();
    }
}
