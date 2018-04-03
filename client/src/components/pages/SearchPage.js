import React from 'react'
import{BackTop}from'antd'
import SearchResult from './SearchResult'
import './AccountInfoPage.css'

const SearchPage=()=>
    (
      <div className="background">
         Notification Dashboard
         <div className="secondspan"><h1>- Search Result -</h1></div>
         <SearchResult/>
         <BackTop className="back-up">
         <div className="ant-back-top-inner">BACK</div>
         </BackTop>
      </div>
    );
export default SearchPage;
