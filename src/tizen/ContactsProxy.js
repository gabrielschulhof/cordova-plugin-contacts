/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

( function() {

var addressBook = tizen.contact.getDefaultAddressBook(),
	ContactError = require( "org.apache.cordova.contacts.ContactError" ),
	ContactUtils = require( "org.apache.cordova.contacts.ContactUtils" ),
	utils = require( "cordova/utils" ),
	pushToArrayAndUnroll = function( source, destination, fieldName ) {
		var item, types, index, typeIndex;

		for ( index in source ) {
			item = source[ index ];
			if ( item[ fieldName ] ) {
				types = item.types;
				if ( types && types.length > 0 ) {
					for ( typeIndex in types ) {
						destination.push({
							"type": types[ typeIndex ],
							"value": item[ fieldName ],
							// If isDefault is true for this item and it has multiple types,
							// then only the first type will have default set to true in Cordova
							"default": ( item.isDefault && typeIndex === 0 )
						});
					}
				}
			}
		}
	},
	tizenToCordova = function( tizenContact ) {
		var index, typeIndex, types, item, cordovaContact,
			tizenAddresses = tizenContact.addresses,
			tizenOrganizations = tizenContact.organizations,
			tizenUrls = tizenContact.urls;

		window.tizenContacts = window.tizenContacts || {};
		window.tizenContacts[ tizenContact.id ] = tizenContact;

		cordovaContact = {
			id: tizenContact.id,
			displayName: null,
			name: null,
			nickname: null,
			phoneNumbers: [],
			emails: [],
			addresses: [],
			ims: [],
			organizations: [],
			birthday: tizenContact.birthday || null,
			note: null,
			photos: [],
			urls: []
		};

		// Name
		if ( tizenContact.name ) {
			cordovaContact.displayName = tizenContact.name.displayName || null;

			cordovaContact.name = {
				formatted: tizenContact.name.displayName || null,
				familyName: tizenContact.name.lastName || null,
				givenName: tizenContact.name.firstName || null,
				middleName: tizenContact.name.middleName || null,
				honorificPrefix: tizenContact.name.prefix || null,
				honorificSuffix: tizenContact.name.suffix || null
			};

			cordovaContact.nickname =
				( tizenContact.name.nicknames && tizenContact.name.nicknames.length > 0 ) ?
					tizenContact.name.nicknames[ 0 ] : null;
		}

		// Phone number
		// Since a Tizen phone number can have multiple types, we unroll each of the
		// types into its own Cordova phone number
		pushToArrayAndUnroll( tizenContact.phoneNumbers || [], cordovaContact.phoneNumbers, "number" );

		// Email
		// Since a Tizen email can have multiple types, we unroll each of the
		// types into its own Cordova email
		pushToArrayAndUnroll( tizenContact.emails || [], cordovaContact.emails, "email" );

		// Address
		// Since a Tizen addresses can have multiple types, we unroll each of the
		// types into its own Cordova address
		for ( index in tizenAddresses ) {
			item = tizenAddresses[ index ];
			types = item.types;
			if ( types && types.length > 0 ) {
				for ( typeIndex in types ) {
					cordovaContact.addresses.push({
						// If isDefault is true for this item and it has multiple types,
						// then only the first type will have default set to true in Cordova
						"pref": ( item.isDefault && typeIndex === 0 ),
						"type": types[ typeIndex ],
						"formatted": null,
						"streetAddress": item.streetAddress || null,
						"locality": item.city || null,
						"region": item.region || null,
						"postalCode": item.postalCode || null,
						"country": item.country || null
					});
				}
			}
		}

		// Organizations
		for ( index in tizenOrganizations ) {
			item = tizenOrganizations[ index ];
			cordovaContact.organizations.push({
				// Tizen doesn't have a "preferred" organization ...
				"pref": false,
				// ... nor a "type"
				"type": "HOME",
				"name": item.name || null,
				"department": item.department || null,
				"title": item.title || null
			});
		}

		// Note
		// We can only transfer the first note to the Cordova contact
		if ( tizenContact.notes && tizenContact.notes.length > 0 ) {
			cordovaContact.note = tizenContact.notes[ 0 ];
		}

		// Photo
		// The Tizen Contact provides only one photo URI
		if ( tizenContact.photoURI ) {
			cordovaContact.photos.push({
				"type": "HOME",
				"value": tizenContact.photoURI,
				// This is the only photo, so why not?
				"pref": true
			});
		}

		// URLs
		for ( index in tizenUrls ) {
			item = tizenUrls[ index ];
			if ( item.url ) {
				cordovaContact.urls.push({
					"type": item.type,
					"value": item.url,
					"pref": false
				});
			}
		}

		return cordovaContact;
	};

var traceTizenContact = function (tizenContact) {
    console.log("cordova/plugin/tizen/Contact/  tizenContact.id " + tizenContact.id);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.personId " + tizenContact.personId);     //Tizen 2.0
    console.log("cordova/plugin/tizen/Contact/  tizenContact.addressBookId " + tizenContact.addressBookId);  //Tizen 2.0

    console.log("cordova/plugin/tizen/Contact/  tizenContact.lastUpdated " + tizenContact.lastUpdated);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.isFavorite " + tizenContact.isFavorite);  //Tizen 2.0

    console.log("cordova/plugin/tizen/Contact/  tizenContact.name " + tizenContact.name);

    //console.log("cordova/plugin/tizen/Contact/  tizenContact.account " + tizenContact.account);  //Tizen 2.0

    console.log("cordova/plugin/tizen/Contact/  tizenContact.addresses " + tizenContact.addresses);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.photoURI " + tizenContact.photoURI);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.phoneNumbers " + tizenContact.phoneNumbers);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.emails " + tizenContact.emails);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.birthday " + tizenContact.birthday);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.anniversaries " + tizenContact.anniversaries);

    console.log("cordova/plugin/tizen/Contact/  tizenContact.organizations " + tizenContact.organizations);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.notes " + tizenContact.notes);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.urls " + tizenContact.urls);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.ringtonesURI " + tizenContact.ringtonesURI);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.groupIds " + tizenContact.groupIds);    //Tizen 2.0

    //console.log("cordova/plugin/tizen/Contact/  tizenContact.categories " + tizenContact.categories);  //Tizen 2.0
};

/**
 * Retrieves a Tizen Contact object from the device by its unique id.
 *
 * @param uid
 *            Unique id of the contact on the device
 * @return {tizen.Contact} Tizen Contact object or null if contact with
 *         specified id is not found
 */
var findByUniqueId = function(id, successCallback, errorCallback) {

    if (!id) {
			errorCallback( "findByUniqueId: No id given" );
    }

    addressBook.find(
        function _successCallback(contacts){
					successCallback && successCallback( contacts[ 0 ] );
        },
        function _errorCallback(error){
            console.log("tizen find error " + error);
						errorCallback && errorCallback( error );
        },
        new tizen.AttributeFilter('id', 'CONTAINS', id),
        new tizen.SortMode('id', 'ASC'));
};

/* The actual guts of saving a Tizen contact */
var saveContact = function( contact, tizenContact ) {
	var update = false,
		i = 0;

    // contact not found on device, create a new one
    if (!tizenContact) {
        tizenContact = new tizen.Contact();
    }
    // update the existing contact
    else {
        update = true;
    }

    // NOTE: The user may be working with a partial Contact object, because only
    // user-specified Contact fields are returned from a find operation (blame
    // the W3C spec). If this is an update to an existing Contact, we don't
    // want to clear an attribute from the contact database simply because the
    // Contact object that the user passed in contains a null value for that
    // attribute. So we only copy the non-null Contact attributes to the
    // Tizen Contact object before saving.
    //
    // This means that a user must explicitly set a Contact attribute to a
    // non-null value in order to update it in the contact database.
    //
    traceTizenContact (tizenContact);

    // display name
    if (contact.displayName !== null) {
        if (tizenContact.name === null) {
            tizenContact.name = new tizen.ContactName();
        }
        if (tizenContact.name !== null) {
            tizenContact.name.displayName = contact.displayName;
        }
    }

    // name
    if (contact.name !== null) {
        if (contact.name.givenName) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.firstName = contact.name.givenName;
            }
        }

        if  (contact.name.middleName) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.middleName = contact.name.middleName;
            }
        }

        if (contact.name.familyName) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.lastName = contact.name.familyName;
            }
        }

        if (contact.name.honorificPrefix) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.prefix = contact.name.honorificPrefix;
            }
        }

        //Tizen 2.0
        if (contact.name.honorificSuffix) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.suffix = contact.name.honorificSuffix;
            }
        }
    }

    // nickname
    if (contact.nickname !== null) {
        if (tizenContact.name === null) {
            tizenContact.name = new tizen.ContactName();
        }
        if (tizenContact.name !== null) {
            if (!utils.isArray(tizenContact.name.nicknames))
            {
                tizenContact.name.nicknames = [];
            }
            tizenContact.name.nicknames[0] = contact.nickname;
        }
    }
    else {
        tizenContact.name.nicknames = [];
    }

    // notes - Tizen 2.0 (was note)
    if (contact.note !== null) {
        if (tizenContact.notes === null) {
            tizenContact.notes = [];
        }
        if (tizenContact.notes !== null) {
            tizenContact.notes[0] = contact.note;
        }
    }

    // photos
    if (contact.photos && utils.isArray(contact.photos) && contact.photos.length > 0) {
        tizenContact.photoURI = contact.photos[0].value;
    }

    if (utils.isDate(contact.birthday)) {
        if (!utils.isDate(tizenContact.birthday)) {
            tizenContact.birthday = new Date();
        }
        if (utils.isDate(tizenContact.birthday)) {
            tizenContact.birthday.setDate(contact.birthday.getDate());
        }
    }

    // Tizen supports many email addresses
    if (utils.isArray(contact.emails)) {

        // if this is an update, re initialize email addresses
        if (update) {
            // doit on effacer sur un update??????
        }

        // copy the first three email addresses found
        var emails = [];
        for (i = 0; i < contact.emails.length; i += 1) {
            var emailTypes = [];

            emailTypes.push (contact.emails[i].type);

            emails.push(
                new tizen.ContactEmailAddress(
                    contact.emails[i].value,
                    emailTypes,
                    contact.emails[i].pref));    //Tizen 2.0

        }
        tizenContact.emails = emails.length > 0 ? emails : [];
    }
    else {
        tizenContact.emails = [];
    }

    // Tizen supports many phone numbers
    // copy into appropriate fields based on type
    if (utils.isArray(contact.phoneNumbers)) {
        // if this is an update, re-initialize phone numbers
        if (update) {
        }

        var phoneNumbers = [];

        for (i = 0; i < contact.phoneNumbers.length; i += 1) {

            if (!contact.phoneNumbers[i]) {
                continue;
            }

            var phoneTypes = [];
            phoneTypes.push (contact.phoneNumbers[i].type);


            phoneNumbers.push(
                new tizen.ContactPhoneNumber(
                    contact.phoneNumbers[i].value,
                    phoneTypes,
                    contact.phoneNumbers[i].pref)    //Tizen 2.0
            );
        }

        tizenContact.phoneNumbers = phoneNumbers.length > 0 ? phoneNumbers : [];
    }
    else {
        tizenContact.phoneNumbers = [];
    }

    if (utils.isArray(contact.addresses)) {
        // if this is an update, re-initialize addresses
        if (update) {
        }

        var addresses = [],
            address = null;

        for ( i = 0; i < contact.addresses.length; i += 1) {
            address = contact.addresses[i];

            if (!address) {
                continue;
            }

            var addressTypes = [];
            addressTypes.push (address.type);

            addresses.push(
                new tizen.ContactAddress({
                         country:                   address.country,
                         region :                   address.region,
                         city:                      address.locality,
                         streetAddress:             address.streetAddress,
                         additionalInformation:     "",
                         postalCode:                address.postalCode,
                         isDefault:                    address.pref, //Tizen 2.0
                         types :                    addressTypes
                }));

        }
        tizenContact.addresses = addresses.length > 0 ? addresses : [];

    }
    else{
        tizenContact.addresses = [];
    }

    // copy first url found to cordova 'urls' field
    if (utils.isArray(contact.urls)) {
        // if this is an update, re-initialize web page
        if (update) {
        }

        var url = null,
            urls = [];

        for ( i = 0; i< contact.urls.length; i+= 1) {
            url = contact.urls[i];

            if (!url || !url.value) {
                continue;
            }

            urls.push( new tizen.ContactWebSite(url.value, url.type));
        }
        tizenContact.urls = urls.length > 0 ? urls : [];
    }
    else{
        tizenContact.urls = [];
    }

    if (utils.isArray(contact.organizations) && contact.organizations.length > 0 ) {
         // if this is an update, re-initialize addresses
        if (update) {
        }

        var organizations = [],
            organization = null;

        for ( i = 0; i < contact.organizations.length; i += 1) {
            organization = contact.organizations[i];

            if (!organization) {
                continue;
            }

            organizations.push(
                new tizen.ContactOrganization({
                    name:          organization.name,
                    department:    organization.department,
                    title:         organization.title,
                    role:          "",
                    logoURI:       ""
                }));

        }
        tizenContact.organizations = organizations.length > 0 ? organizations : [];

    }
    else{
        tizenContact.organizations = [];
    }

    // categories
    if (utils.isArray(contact.categories)) {
        tizenContact.categories = [];

        var category = null;

        for (i = 0; i < contact.categories.length; i += 1) {
            category = contact.categories[i];

            if (typeof category === "string") {
                tizenContact.categories.push(category);
            }
        }
    }
    else {
        tizenContact.categories = [];
    }

    // save to device
    // in tizen contact mean update or add
    // later we might use addBatch and updateBatch
    if (update){
        tizen.contact.getDefaultAddressBook().update(tizenContact);
    }
    else {
        tizen.contact.getDefaultAddressBook().add(tizenContact);
    }

    // Use the fully populated Tizen contact object to create a
    // corresponding W3C contact object.
    return ContactUtils.createContact(tizenContact, [ "*" ]);
};

/**
 * Creates a Tizen contact object from the W3C Contact object and persists
 * it to device storage.
 *
 * @param {Contact}
 *            contact The contact to save
 * @return a new contact object with all properties set
 */
var saveToDevice = function( contact, successCallback, failureCallback ) {

		successCallback = ( typeof successCallback === "function" ? successCallback : function(){} );
		failureCallback = ( typeof failureCallback === "function" ? failureCallback : function(){} );

    if (!contact) {
				failureCallback( "no contact specified" );
        return;
    }

    // if the underlying Tizen Contact object already exists, retrieve it for
    // update
    if (contact.id) {
        // we must attempt to retrieve the BlackBerry contact from the device
        // because this may be an update operation
				findByUniqueId( contact.id,
					function( tizenContact ) {
						successCallback( saveContact( contact, tizenContact ) );
					},
					function( error ) {
						successCallback( saveContact( contact, null ) );
					});
    } else {
			successCallback( saveContact( contact, null ) );
		}
};

module.exports = {
	save: function( successCallback, failureCallback, args ) {
		var contact = args[ 0 ];

		// save the contact and store it's unique id
		saveToDevice( contact,
			function( fullContact ) {

				// This contact object may only have a subset of properties
				// if the save was an update of an existing contact. This is
				// because the existing contact was likely retrieved using a
				// subset of properties, so only those properties were set in the
				// object. For this reason, invoke success with the contact object
				// returned by saveToDevice since it is fully populated.
				contact.id = fullContact.id;
				if ( typeof successCallback === "function" ) {
					successCallback( fullContact );
				}
			},
			function( error ) {
				if ( typeof failureCallback === "function" ) {
					console.log( "ContactsProxy: save: Error saving contact: " + error );
					failureCallback( new ContactError( ContactError.UNKNOWN_ERROR ) );
				}
			});
	},
	remove: function() {
		var x;
	},
	search: function( successCallback, failureCallback, args ) {
		var cordovaContact,
			sortingMode = new tizen.SortMode( 'name.firstName', 'ASC' ),
			phoneFilter = new tizen.AttributeFilter( 'phoneNumbers.number', 'CONTAINS', '' ),
			onContactFindSuccess = function( contacts ) {
				var index, cordovaContacts = [];

				for ( index in contacts ) {
					try {
						cordovaContact = tizenToCordova( contacts[ index ] );
					} catch( e ) {
						console.log( e.message );
					}
					cordovaContacts.push( cordovaContact );
				}
				successCallback( cordovaContacts );
			},
			onError = function( error ) {
				failureCallback( error.name );
			};
		addressBook.find( onContactFindSuccess, onError, phoneFilter, sortingMode );
	},
	cleanup: function(){}
};

require("cordova/tizen/commandProxy").add("Contacts", module.exports);

})();
