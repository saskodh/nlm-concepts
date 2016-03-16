package com.sklechko.nlmconcepts.utils;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/**
 * File util.
 */
public class FileUtil {

    /**
     * Creates new temporary file and writes the given content.
     *
     * @param fileContent file content
     * @return File newly created file
     * */
    public static File writeStringToFile(String fileContent) {
        try {
            File tempFile = File.createTempFile("nlm", "");
            FileWriter fw = new FileWriter(tempFile);
            fw.write(fileContent);
            fw.close();
            return tempFile;
        } catch (IOException e) {
            // todo throw concrete exception
            throw new RuntimeException("File cannot be created");
        }
    }
}
