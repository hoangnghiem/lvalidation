var ExistenceCheckSupport = Class.create();

ExistenceCheckSupport.DEFAULT_OPTIONS = {
    triggerId: 'bnt-existence',
    triggerClass: "blue small button",
    triggerLabel: 'Check Existence',
    triggerPosition: Insertion.After,
    readonlyClass: '',
    switcherClass: '',
    switcherType: 'link',
    switcherLabel: 'Change',
    loadingLabel: 'Loading...',
    loadingClass: 'loading',
    validText: 'ok',
    validClass: 'valid',
    invalidClass: 'error',
    invalidText: 'Already used',
    liveValidationFunctions: []
};
/**
 * Support existence validation on an element.
 */
ExistenceCheckSupport.prototype = {
    /**
     * Constructor for ExistenceCheckSupport - validate existence of the target element against the database
     *
     * @param element Mixed - either a dom element reference or the string id of the element to validate
     * @param url String - url to be check existence against
     * @param options Object - general options
     */
    initialize: function(element, url, options) {
        if (!element) throw new Error("Element must be provided");
        if (!url || url == '') throw new Error("url to check existence must be provided");
        this.element = $(element);
        this.url = url;
        this.currentValue = this.element.value;

        this.options = Object.extend(ExistenceCheckSupport.DEFAULT_OPTIONS , options || {});

        this.trigger = this.createTrigger();
        var destroyMessageHandle = this.destroyMessage.bind(this);
        this.element.observe('click', destroyMessageHandle);
        this.isValid = false;
        this.liveValidator = null;
        // setup LiveValidation
        if (this.options.liveValidationFunctions.length > 0) {
            this.liveValidator = new LiveValidation(this.element, {
                validMessage: this.options.validText,
                wait: 500,
                insertAfterWhatNode: this.trigger,
                onValid: function() {}
            });
            this.options.liveValidationFunctions.each(function(lvFn) {
                this.liveValidator.add(lvFn.fnc, lvFn.params);
            }.bind(this));
        }
    },
    /**
     * Create the trigger element, by default the trigger will be placed after the target element.
     *
     * @return triggerObj the trigger element
     */
    createTrigger: function() {
        var trigger = new Element('input', {
            'type': 'button',
            'id': this.options.triggerId,
            'className': this.options.triggerClass,
            'value': this.options.triggerLabel
        });
        trigger.observe('click', this.triggerFireHandler.bindAsEventListener(this));
        new Insertion.After(this.element, trigger);
        return trigger;
    },
    /**
     * Handle the click event on the trigger
     *
     * @param event the click event object
     */
    triggerFireHandler: function(event) {
        var validlV = false;
        try {
            if (this.liveValidator) {
                validlV = this.liveValidator.validate();
            }
        } catch(error) {
            validlV = false;
        }
        if (validlV) {
            if (this.currentValue != this.element.value) {
                this.destroyMessage();
                this.validate();
            } else {
                this.showMessage(this.isValid);
                if (this.isValid) {
                    this.editMode(false);
                    this.createReadonly();
                }
            }
        }
    },
    /**
     * Submit the request to the server to check existence
     */
    validate: function() {
        this.currentValue = this.element.value;
        this.showLoading();
        var valid = false;
        var successHandle = this.hideLoading.bind(this);
        new Ajax.Request(this.url + this.element.value, {
            method: 'get',
            asynchronous: false,
            onSuccess: function(request) {
                valid = request.responseJSON.valid;
                successHandle(valid);                
            },
            onFailure: function() {
                successHandle(false);
                valid = false;
            }
        });
        this.isValid = valid;
        return valid;
    },
    /**
     * Create readonly elements
     */
    createReadonly: function() {
        if (!$(this.element.id + "-readonly") && !$(this.element.id + "-clink")) {
            var readonly = new Element('span', {
                'id': this.element.id + "-readonly",
                'className': this.options.readonlyClass,
                'style' : 'display:inline;font-weight:bold;margin-right:5px;'
            }).update(this.element.value);

            var switcher;
            if (this.options.switcherType == 'button') {
                switcher = new Element('input', {
                    'id': this.element.id + "-clink",
                    'className': this.options.switcherClass,
                    'style' : 'display:inline;',
                    'type' : 'button',
                    'value':this.options.switcherLabel
                }).update(this.options.switcherLabel);
            } else {
                switcher = new Element('a', {
                    'id': this.element.id + "-clink",
                    'className': this.options.switcherClass,
                    'style' : 'display:inline;',
                    'href': 'javascript:void(0);'
                }).update(this.options.switcherLabel);
            }
            switcher.observe('click', this.switchHandle.bindAsEventListener(this));

            new Insertion.After($(this.trigger), readonly);
            new Insertion.After(readonly, switcher);
        }
    },
    /**
     * Handle change click event
     * @param event the click event
     */
    switchHandle: function(event) {
        $(this.element.id + "-readonly").remove();
        $(this.element.id + "-clink").remove();
        this.editMode(true);
    },
    /**
     * Show/hide the target input
     * @param show true to show the input
     */
    editMode: function(show) {
        if (show) {
            this.element.show();
            this.trigger.show();
        } else {
            this.element.hide();
            this.trigger.hide();
        }
    },
    showLoading: function() {
        if (!$(this.element.id + "-loading")) {
            var loadingSpan = new Element('span', {
                'id': this.element.id + "-loading",
                'className': this.options.loadingClass
            }).update(this.options.loadingLabel);
            new Insertion.After($(this.trigger), loadingSpan);
        }
    },
    hideLoading: function(valid) {
        var fadeFinishHandle = this.destroyLoading.bind(this, valid);
        new Effect.Fade($(this.element.id + "-loading"), {
            afterFinishInternal: fadeFinishHandle
        })
    },
    destroyLoading: function(valid) {
        $(this.element.id + "-loading").remove();
        this.showMessage(valid);
        if (valid) {
            this.createReadonly();
            this.editMode(false);
        }
    },
    showMessage: function(valid) {
        var msgId = this.element.id + (valid ? "-success" : "-error");
        if (!$(msgId)) {
            var msgSpan = new Element('span', {
                'id': msgId,
                'className': valid ? this.options.validClass : this.options.invalidClass
            }).update(valid ? this.options.validText : this.options.invalidText);
            new Insertion.After($(this.trigger), msgSpan);

            // fade the message when valid
            if (valid) {
                var fadeFinishHandle = this.destroyMessage.bind(this);
                new Effect.Fade($(this.element.id + "-success"), {
                    duration: 1.0,
                    afterFinishInternal: fadeFinishHandle
                })
            }
        }
    },
    destroyMessage: function() {
        if ($(this.element.id + "-success"))
            $(this.element.id + "-success").remove();
        if ($(this.element.id + "-error"))
            $(this.element.id + "-error").remove();
    }
};

var PasswordStrengthMeter = Class.create();
PasswordStrengthMeter.prototype = {
    initialize: function(element, meter, options) {
        if (!element) throw new Error("Element must be provided");
        if (!meter) throw new Error("Meter must be provided");
        this.element = $(element);
        this.meter = $(meter);
        this.options = Object.extend({
            meterLevelPrefix: 'lv'
        }, options || {});
        this.element.observe('keyup', this.updateMeter.bindAsEventListener(this));
    },
    getStrength: function() {
        var passwd = this.element.getValue();
        var valid = true;
        var level = 0;

        // PASSWORD LENGTH
        if (passwd.length < 6 || passwd.length > 33) valid = false;

        // LETTERS
        if (passwd.match(/[a-z]/)) level += 1;
        if (passwd.match(/[A-Z]/)) level += 1;

        // NUMBERS
        if (passwd.match(/\d+/)) level += 1;

        // SPECIAL CHAR
        if (passwd.match(/.[!,@,#,$,%,^,&,*,?,_,~]/)) level += 1;

        if (!valid) level = 0;
        if (level > 4) level = 4;

        return level;
    },
    updateMeter: function() {
        var meters = this.meter.descendants();
        var score = this.getStrength();
        meters.each(function(meter, index) {
            var lv = index + 1;
            if (score < 1 || lv > score) {
                $(meter).removeClassName('mark');
            } else {
                $(meter).addClassName('mark');
            }
        });

        /*var score = this.getStrength();
        this.meter.removeAttribute('class');
        this.meter.addClassName('is0');
        if (score > 0) this.meter.addClassName('is' + score);*/
    }
};