import React from 'react'
import Nav from './Nav'

export default function Toolbar() {
  return (
    <footer className='fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white md:hidden'>
        <Nav/>
    </footer>
  )
}

