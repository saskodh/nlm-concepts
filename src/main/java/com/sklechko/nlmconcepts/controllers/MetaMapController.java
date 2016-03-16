package com.sklechko.nlmconcepts.controllers;

import com.sklechko.nlmconcepts.services.MetaMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint for MetaMap features.
 */
@RestController
@RequestMapping("meta-map")
public class MetaMapController {

    @Autowired
    private MetaMapService metaMapService;

    @RequestMapping(path = "referenced-concepts", method = RequestMethod.GET)
    public String getReferencedConcepts(@RequestParam("text") String textContent) {
        return metaMapService.getReferencedConcepts(textContent);
    }
}
