package org.orcid.member.client;

import javax.ws.rs.core.MediaType;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;

@AuthorizedFeignClient(name = "assertionservice")
public interface AssertionServiceClient {

    @RequestMapping(method = RequestMethod.GET, value = "/api/assertion/owner/{encryptedEmail}", consumes = MediaType.APPLICATION_JSON, produces = MediaType.APPLICATION_JSON)
    @HystrixProperty(name = "hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds", value = "50000")
    ResponseEntity<String> getOwnerOfUser(@PathVariable("encryptedEmail") String encryptedEmail);
    
}
