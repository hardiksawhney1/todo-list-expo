import React, { createContext, useContext, useState } from 'react';
import { searchI } from '../assets';

const SearchBool = createContext({
    search:false,
    setSearch:(value:boolean)=>{},
    contentArray:[],
    setContentArray:(value:any)=>{}

});

export const useSearchBool = () => {
  return useContext(SearchBool);
};

const SearchContext = ({ children }:any) => { // Destructure children from props
  const [search, setSearch] = useState(false);
  const [contentArray, setContentArray] = useState([]);

  return ( 
    <SearchBool.Provider value={{search, setSearch, contentArray, setContentArray}}>
      {children} 
    </SearchBool.Provider>
  );
};

export default SearchContext;
