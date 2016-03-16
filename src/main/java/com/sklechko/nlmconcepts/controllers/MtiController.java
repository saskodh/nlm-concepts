package com.sklechko.nlmconcepts.controllers;

import com.sklechko.nlmconcepts.services.MtiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint for MTI features.
 */
@RestController
@RequestMapping("mti")
public class MtiController {

    @Autowired
    private MtiService mtiService;

    @RequestMapping(path = "concepts", method = RequestMethod.GET, produces = "text/plain")
    public String getReferencedConcepts(@RequestParam("text") String textContent) {
        return mtiService.getReferencedConcepts(textContent);
    }
}
