$(function () {

    App.Views.SurveyTable = Backbone.View.extend({
        authorName: null,
        tagName: "table",
        className: "table table-striped",
        surveyInfo:[],
        add: function (model, isAlreadyDownloaded, isSubmitted, memberId) {
            this.surveyInfo[model._id]= model;
            if (isAlreadyDownloaded == false) {
                this.$el.append('<tr id="' + model._id + '"><td>' + model.SurveyNo+ '</td><td>' + model.SurveyTitle+ '</td><td><a name="' +model._id +
                '" class="downloadSurvey btn btn-info">' + App.languageDict.get('Download') + '</a><label>&nbsp&nbsp' + App.languageDict.get('New') + '</label></td></tr>');
            } else {
                this.$el.append('<tr id="' + model._id + '"><td>' + model.SurveyNo+ '</td><td>' + model.SurveyTitle+ '</td><td><a name="' +model._id +
                    '" class="openSurvey btn btn-info" href="#openSurvey/' + model._id + '/' + isSubmitted + '/' + memberId +
                    '">' + App.languageDict.get('Open') + '</a></td></tr>');
            }
        },
        events:{
            "click .downloadSurvey": 'downloadSurvey'
        },
        render: function () {
            var that = this;
            var members = new App.Collections.Members()
            var member, memberId;
            members.login = $.cookie('Member.login');
            members.fetch({
                success: function () {
                    if (members.length > 0) {
                        member = members.first();
                        memberId = member.get('login') + '_' + member.get('community');
                    }
                }
            });
            this.$el.html('<tr><th>' + App.languageDict.get('Survey_Number') + '</th><th>' + App.languageDict.get('Title') + '</th><th>' + App.languageDict.get('Actions') + '</th></tr>');
            var nationName = App.configuration.get('nationName');
            var nationUrl = App.configuration.get('nationUrl');
            var SurveyDocsFromComm=[];
            $.ajax({
                url: '/survey/_design/bell/_view/surveyBySentToCommunities?_include_docs=true&key="' + App.configuration.get('name') + '"',
                type: 'GET',
                dataType: 'json',
                async:false,
                success: function(commSurdata) {
                    _.each(commSurdata.rows, function(row) {
                        SurveyDocsFromComm.push(row);
                    });
                },
                error: function(status) {
                    console.log(status);
                }
            });
            that.getSurveys(SurveyDocsFromComm);
            applyCorrectStylingSheet(App.languageDict.get('directionOfLang'));
        },
        renderSurveys: function (surveyArray,localSurvey) {
            for(var i=0;i<surveyArray.length;i++)
            {
                this.add(surveyArray[i],false,false,null);
            }
            for(var i=0;i<localSurvey.length;i++)
            {
                this.add(localSurvey[i],true,false,null);
            }
        },
        getSurveys: function(SurveyDocsFromComm){
            var nationName = App.configuration.get('nationName');
            var nationUrl = App.configuration.get('nationUrl');
            var surveyArray=[];
            var that=this;
            $.ajax({
                url: 'http://' + nationName + ':oleoleole@' + nationUrl + '/survey/_design/bell/_view/surveyBySentToCommunities?_include_docs=true&key="' + App.configuration.get('name') + '"',
                type: 'GET',
                dataType: 'jsonp',
                success: function (json) {
                    var SurveyDocsFromNation = [];
                    _.each(json.rows, function (row) {
                        SurveyDocsFromNation.push(row);
                    });
                    _.each(SurveyDocsFromNation,function(row){
                        var surveyFromNation = row.value;
                        var index = SurveyDocsFromComm.map(function(element) {
                            return element.value._id;
                        }).indexOf(surveyFromNation._id);
                        if (index == -1) { // its a new or yet-to-be-download survey from nation, so display it as new
                            surveyArray.push( surveyFromNation);
                        }
                    });
                    var localSurvey = [];
                    for(var i = 0 ; i < SurveyDocsFromComm.length ; i++) {
                        var surveyDoc = SurveyDocsFromComm[i].value;
                        localSurvey.push( surveyDoc);
                    }
                    that.renderSurveys(surveyArray,localSurvey);
                },
                async: false
            });
        },
        downloadSurvey: function(e) {
            App.startActivityIndicator();
            var surveyId = [];
            surveyId.push(e.currentTarget.name);
            var surveyToDownload = this.surveyInfo[surveyId];
            var surveyQuestionIds = surveyToDownload.questions;
            var nationName = App.configuration.get('nationName');
            var nationUrl = App.configuration.get('nationUrl');
            $.ajax({
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                },
                type: 'POST',
                url: '/_replicate',
                dataType: 'json',
                data: JSON.stringify({
                    "source": 'http://'+ nationName + ':oleoleole@' + nationUrl + '/survey',
                    "target": "survey",
                    'doc_ids': surveyId
                }),
                async: false,
                success: function (response) {
                    $.ajax({
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json; charset=utf-8'
                        },
                        type: 'POST',
                        url: '/_replicate',
                        dataType: 'json',
                        data: JSON.stringify({
                            "source": 'http://'+ nationName + ':oleoleole@' + nationUrl + '/surveyquestions',
                            "target": "surveyquestions",
                            'doc_ids': surveyQuestionIds
                        }),
                        async: false,
                        success: function (response) {
                            alert(App.languageDict.get('Survey_Download_Success_Msg'));
                            window.location.reload(false);
                        },
                        error: function(status) {
                            console.log(status);
                            console.log(App.languageDict.get('Survey_Download_Error_Ques'));
                        }
                    });
                },
                error: function(status) {
                    console.log(status);
                    console.log(App.languageDict.get('Survey_Download_Error_Msg'));
                }
            });
        }
    })
})