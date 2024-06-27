# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'custom_dashboard',
    'version': '1.0',
    'summary': "Custom dashboad module",
    'sequence': 15,
    'author': "anand",
    'description': """
Custom Dashboard using chart.js
""",
    'category': 'Custom/Dashboard',
    'depends': ['base', 'web', 'sale', 'board'],
    'data': ['views/templates.xml'],
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
    'assets': {
        'web.assets_backend': [
            'custom_dashboard/static/src/**/*',
            'custom_dashboard/static/src/**/**/*',
        ],
    }
}
