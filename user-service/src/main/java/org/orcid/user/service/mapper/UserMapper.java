package org.orcid.user.service.mapper;

import org.orcid.user.domain.User;
import org.orcid.user.service.MemberService;
import org.orcid.user.service.dto.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    @Autowired
    private MemberService memberService;

    public User toUser(UserDTO userDTO) {
        User user = new User();
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setEmail(userDTO.getEmail().toLowerCase());
        user.setImageUrl(userDTO.getImageUrl());
        user.setDeleted(Boolean.FALSE);
        user.setSalesforceId(userDTO.getSalesforceId());
        user.setMemberName(memberService.getMemberNameBySalesforce(userDTO.getSalesforceId()));
        user.setMainContact(userDTO.getMainContact());
        user.setLangKey(userDTO.getLangKey());
        user.setActivated(userDTO.isActivated());
        user.setAuthorities(userDTO.getAuthorities());
        user.setMainContact(user.getMainContact());
        user.setId(userDTO.getId());
        user.setLoginAs(userDTO.getLoginAs());
        return user;
    }

    public UserDTO toUserDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setEmail(user.getEmail());
        userDTO.setActivated(user.getActivated());
        userDTO.setImageUrl(user.getImageUrl());
        userDTO.setLangKey(user.getLangKey());
        userDTO.setCreatedBy(user.getCreatedBy());
        userDTO.setCreatedDate(user.getCreatedDate());
        userDTO.setLastModifiedBy(user.getLastModifiedBy());
        userDTO.setLastModifiedDate(user.getLastModifiedDate());
        userDTO.setAuthorities(user.getAuthorities());
        userDTO.setSalesforceId(user.getSalesforceId());
        userDTO.setMemberName(user.getMemberName());
        userDTO.setMainContact(user.getMainContact());
        userDTO.setId(user.getId());
        userDTO.setLoginAs(user.getLoginAs());
        return userDTO;
    }

}