package com.sklechko.nlmconcepts.services;

/**
 * Service for accessing MetaMap.
 */
public interface MetaMapService {

    /**
     * Returns un-parsed MetaMap results containing list of all referenced concepts in the given text content.
     *
     * @param textContent text content
     * @return MetaMap results
     * */
    String getReferencedConcepts(String textContent);
}
