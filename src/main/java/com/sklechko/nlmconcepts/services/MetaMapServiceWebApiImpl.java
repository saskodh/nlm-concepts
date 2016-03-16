package com.sklechko.nlmconcepts.services;

import gov.nih.nlm.nls.skr.GenericObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Web API MetaMap service implementation.
 */
@Service
public class MetaMapServiceWebApiImpl implements MetaMapService {

    @Value("${nlm.cas.email}")
    private String metaMapEmail;

    @Value("${nlm.cas.username}")
    private String metaMapUsername;

    @Value("${nlm.cas.password}")
    private String metaMapPassword;

    @Override
    public String getReferencedConcepts(String textContent) {

        // todo which interactive mode?
        GenericObject myGenericObj = new GenericObject(metaMapUsername, metaMapPassword);

        // todo apply correct configuration
        myGenericObj.setField("Email_Address", metaMapEmail);
        myGenericObj.setFileField("UpLoad_File", "./sample.txt");
        myGenericObj.setField("Batch_Command", "MTI -opt1L_DCMS -E");
        myGenericObj.setField("BatchNotes", "SKR Web API test");
        myGenericObj.setField("SilentEmail", true);

        return myGenericObj.handleSubmission();
    }
}
