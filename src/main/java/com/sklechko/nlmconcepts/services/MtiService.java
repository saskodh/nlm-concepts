package com.sklechko.nlmconcepts.services;

import java.io.File;

/**
 * Service for accessing MTI.
 */
public interface MtiService {

    /**
     * Returns un-parsed MTI results containing list of all referenced concepts in the given text content.
     *
     * @param textContent text content
     * @return MTI results
     * */
    String getReferencedConcepts(String textContent);

    /**
     * Returns un-parsed MTI results containing list of all referenced concepts in the given text content.
     *
     * @param textFile file containing the text content
     * @return MTI results
     * */
    String getReferencedConcepts(File textFile);
}
