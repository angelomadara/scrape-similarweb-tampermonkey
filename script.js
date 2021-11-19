// ==UserScript==
// @name         SimilarWeb get top 5 referral websites
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!

// @author       You
// @match        https://www.similarweb.com/*
// @icon         https://www.google.com/s2/favicons?domain=similarweb.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js
// @require      https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  let btn = document.createElement("button");
  btn.setAttribute("id", "my-awesome-extractor-button");
  btn.innerHTML = "Extract Data";
  btn.style.position = 'fixed';
  btn.style.top = '1px'
  btn.style.right = '1px'
  btn.style.zIndex = '100000';
  document.body.appendChild(btn);

  document.getElementById('my-awesome-extractor-button').onclick = function(){
      console.clear();
      let websiteName = document.querySelector(".websiteHeader-captionText").innerText
      let country = document.querySelector(".js-countryRank .websiteRanks-name")
      country = country != null ? country.innerText : ''

      let categoryType = document.querySelector(".js-categoryRank .websiteRanks-nameText")
      categoryType = categoryType != null ? categoryType.innerText : ""


      let topReferrals = document.querySelectorAll('.referring div.websitePage-listItemTitle')
      let topReferralsTrafficShare = document.querySelectorAll('.referring .websitePage-trafficShare')

      let table = document.createElement('table');

      table.style.fontFamily = "Arial"
      table.style.fontSize = '12px'
      table.style.width = '80%'
      table.style.border = '1px solid #ddd'

      let total_visits = document.querySelector(".engagementInfo-valueNumber")
      total_visits = total_visits != null ? total_visits.innerText : 0
      let kmb = total_visits.split("").slice(-1)[0].toLowerCase()
      let total_visitors = 0

      let visitors = total_visits.replace(".","").replace("K","").replace("<","")
      let missingZeros = 0

      if(kmb == 'k') {
          if(visitors.length <= 2 && !total_visits.includes(".")) {
              missingZeros = `000`
          }
          //else if(visitors.length == 2 && !total_visits.includes(".")) {
          //    missingZeros = ``
          //}
          else if(visitors.length == 3 && !total_visits.includes(".")) {
            missingZeros = `000`
          }
          else if((visitors.length == 5 || visitors.length == 4) && total_visits.includes(".")) {
            missingZeros = `0`
          }
          else{missingZeros = `00`}
          total_visitors = `${visitors.replace("K","")}${missingZeros}`
      }
      else if(kmb == 'm') {
          if(visitors.length <= 3 && !total_visits.includes(".")) {missingZeros = `000000`}
          else if(visitors.length == 3 && total_visits.includes(".")) {
            missingZeros = `00000`
          }else{
            missingZeros = `0000`
          }
          total_visitors = `${visitors.replace("M","")}${missingZeros}`
      }
      else if(kmb == 'b') {
          if(visitors.length <= 3 && !total_visits.includes(".")) {missingZeros = `000000000`}
          else if(visitors.length == 3 && total_visits.includes(".")) {
            missingZeros = `00000000`
          }else{
            missingZeros = `0000000`
          }
          total_visitors = `${visitors.replace("B","")}${missingZeros}`
      }
      // console.log(total_visitors)

      let total_referrals = document.querySelector(".websitePage-referrals .subheading-value")
      let referral_traffic_percent = total_referrals != null ? parseFloat(total_referrals.innerText) : 0;

      let websiteRank = document.querySelector(".js-categoryRank > .websiteRanks-valueContainer").innerText
      let shortCategory = categoryType.length > 0 ? categoryType.split(" ")[0] : ''
      
      let reperals = referrals()
      
      let tbody = `<tbody>
                      <tr>
                        <td style='border-right:1px solid #ddd'>${shortCategory}</td>
                        <td style='border-right:1px solid #ddd'>${websiteRank}</td>
                      <td style='border-right:1px solid #ddd'>${country}</td>`

      for(let i = 0; i < 5; i++) {
        if(reperals.length > i && reperals[i].website != 'others') {
          tbody += `<td style='border-right:1px solid #ddd'>${reperals[i].website}</td>`
          tbody += `<td style='border-right:1px solid #ddd'>${reperals[i].sharePercent}</td>`
          tbody += `<td style='border-right:1px solid #ddd'>${Math.ceil((total_visitors * (referral_traffic_percent / 100)) * (reperals[i].sharePercent / 100))}</td>`
        }else{
          tbody += `<td style='border-right:1px solid #ddd'></td>`
          tbody += `<td style='border-right:1px solid #ddd'></td>`
          tbody += `<td style='border-right:1px solid #ddd'></td>`
        }
      }

      tbody += `
          <td style='border-right:1px solid #ddd'>${referral_traffic_percent}</td>
          <td>${total_visitors}</td>
        </tr>
      </tbody>`
      
      table.innerHTML = tbody

      document.querySelector('.app-header').prepend(table)
      
      /**
       * 
       * this next section is for building JSON data for the spreadsheet
       * 
       */
      
      let engagement = "{"
      document.querySelectorAll(".engagementInfo-line").forEach((v,i)=>{
        var data = v.innerText.split(" \n")
        if(i >= 1){
          let key = data[0].trim()
          key = key.charAt(0).toLowerCase() + key.slice(1)
          key = key.replace(/[\. ,:-]+/g,'') // remove spaces, dots, commas, dashes, and colons
          engagement += `"${key}":"${data[1].trim()}",`
        }
      })
      engagement = engagement.substring(0, engagement.length - 1)
      engagement += "}"
      engagement = JSON.parse(engagement)
      
      /**
       * country rank
       */
      let countryRank = {
        "country": country, 
        "rank": parseInt(document.querySelector(".js-countryRank .js-websiteRanksValue").innerText.replace(",","").replace(" ",""))
      }
      
      let fileData = {
        "website" : websiteName,
        "categoryType": categoryType,
        "categoryRank": websiteRank,
        // "countryRank": country,
        "globalRank": parseInt(document.querySelector(".js-globalRank .js-websiteRanksValue").innerText.replace(",","").replace(" ","")),
        "visitors": parseInt(total_visitors)
      }
      let stringifiedData = JSON.stringify({
        ...fileData,
        ...{'countryRank':countryRank},
        ...engagement,
        ...traffics(),
        ...{"referrals": referrals()},
        ...{"destinations": destinations()},
        ...{"socials": socials()}
      }, null, 2)

      let website = document.querySelector(".websiteHeader-captionText").innerText
      /**
       * save json on a text file
       */
      var file = new File(["["+stringifiedData+"]"], `${website}-similarweb-data.json`, {type: "text/plain;charset=utf-8"});
      saveAs(file);

  }

  document.querySelector(".app-search__input").onfocus = function(){
      document.querySelector('.app-header table').remove()
  }
  
  /**
   * 
   * @returns traffic data
   */
  function traffics(){
    let traffics = '{'
    if(document.querySelectorAll("div.trafficSourcesChart > ul > li.trafficSourcesChart-item").length > 0) {
      document.querySelectorAll("div.trafficSourcesChart > ul > li.trafficSourcesChart-item").forEach((v,i) => {
        var data = v.innerText.split("\n \n")
        traffics += `"${data[1].toLowerCase()}Traffic": ${parseFloat(data[0].replace("%\n ",""))}`
        if(i < document.querySelectorAll("div.trafficSourcesChart > ul > li.trafficSourcesChart-item").length - 1) {
          traffics += ','
        }
      })
    }
    traffics += '}'
    traffics = JSON.parse(traffics)
    // console.log(traffics)
    return traffics
  }
  
  /**
   * referrer traffics share chart
   */
  function referrals(){
    let referrals = []
    let totalReferralsLeft = 100
    if(document.querySelectorAll(".referralsSection .referring .websitePage-list li").length > 0) {
      document.querySelectorAll(".referralsSection .referring .websitePage-list li").forEach((v,i)=>{
        var data = v.innerText.split("\n")
        referrals.push({
          "website":data[0],
          "sharePercent":parseFloat(data[1].replace("%",""))
        })
        totalReferralsLeft -= parseFloat(data[1].replace("%",""))
      })
    }
    if(totalReferralsLeft > 0 && totalReferralsLeft < 100) {
      referrals.push({"website": "others", "sharePercent": parseFloat(totalReferralsLeft.toFixed(2))})
    }
    // console.log(referrals)
    return referrals
  }
  
  function destinations(){
    let destinations = []
    let totalDestinationsLeft = 100
    if(document.querySelectorAll(".referralsSection .destination .websitePage-list li").length > 0) {
      document.querySelectorAll(".referralsSection .destination .websitePage-list li").forEach((v,i)=>{
        var data = v.innerText.split("\n")
        destinations.push({
          "website":data[0],
          "sharePercent": parseFloat(data[1].replace("%",""))
        })
        totalDestinationsLeft -= parseFloat(data[1].replace("%",""))
      })
    }
    if(totalDestinationsLeft > 0 && totalDestinationsLeft < 100) {
      destinations.push({"website": "others", "sharePercent": parseFloat(totalDestinationsLeft.toFixed(2))})
    }
    // console.log(destinations)
    return destinations
  }
  
  /**
   * social share chart
   */
  function socials(){
     let socials = []
     let totalSocialsLeft = 100
     if(document.querySelectorAll(".socialList li").length > 0) {
       document.querySelectorAll(".socialList li").forEach((v,i)=>{
         var data = v.innerText.split("\n")
         socials.push({"website":v.childNodes[1].dataset.sitename, "sharePercent":parseFloat(data[1].replace("%",""))})
         totalSocialsLeft -= parseFloat(data[1].replace("%",""))
       })
     }
     if(totalSocialsLeft > 0 && totalSocialsLeft < 100) { socials.push({"website": "others", "sharePercent": parseFloat(totalSocialsLeft.toFixed(2))}) }
     // console.log(socials)
     return socials
  }

})();