/**@odoo-module**/

import { registry } from "@web/core/registry";
import { Component,onMounted,useRef,useState,onWillStart } from "@odoo/owl";
import { KpiCard } from "./kpi_card/kpi_card";
import {useService} from "@web/core/utils/hooks";
import {loadJS} from "@web/core/assets";
import { ChartRenderer } from "./chart_renderer/chart_renderer";
import { getColor } from "@web/core/colors/colors";

class OdooSalesDashboard extends Component{
    async getTopProducts()
    {
        let domain = [['state','in',['sale','done']]]
        if(this.state.period > 0)
        {
            domain.push(['date','>',this.state.current_date])
        }
        const data = await this.orm.readGroup('sale.report',domain,['product_id','price_total'],['product_id'],
        {limit:5,orderby:'price_total desc'})
        this.state.topProducts = {
        data: {
            labels:data.map(d=>d.product_id[1]),
            datasets:[
            {
                label:'Total',
                data:data.map(d=>d.price_total),
                hoverOffset:4,
                backgroundColor: data.map((_,index)=>getColor(index)),
            },
            {
                label:'Count',
                data:data.map(d=>d.product_id_count),
                hoverOffset:4,
                backgroundColor: data.map((_,index)=>getColor(index)),
            },
            ],
        },
        domain,
        label_field:'product_id',
        }
    }
    async getTopSalesPeople()
    {
         let domain = [['state','in',['sale','done']]]
        if(this.state.period > 0)
        {
            domain.push(['date','>',this.state.current_date])
        }
        const data = await this.orm.readGroup('sale.report',domain,['user_id','price_total'],['user_id'],
        {limit:5,orderby:'price_total desc'})
        this.state.topSalesPeople = {
        data: {
            labels:data.map(d=>d.user_id[1]),
            datasets:[
            {
                label:'Total',
                data:data.map(d=>d.price_total),
                hoverOffset:4,
                backgroundColor: data.map((_,index)=>getColor(index)),
            }
            ],
        },
        domain,
        label_field:'user_id',
        }
    }
    async getMonthlySales()
    {
        let domain = [['state','in',['sale','done','draft','sent']]]
        if(this.state.period > 0)
        {
            domain.push(['date','>',this.state.current_date])
        }
        const data = await this.orm.readGroup('sale.report',domain,
        ['date','state','price_total'],['date','state'],
        {orderby:'date',lazy:false})
        const labels = [... new Set(data.map(d=>d.date))]
        const quotations = data.filter(d=>d.state == 'draft' || d.state == 'sent')
        const orders = data.filter(d=>['done','sale'].includes(d.state))
        this.state.monthlySales = {
        data: {
            labels:labels,
            datasets:[
            {
                label:'Quotations',
                data:labels.map(l=>quotations.filter(q=>l==q.date).map(j=>j.price_total).reduce((a,c)=>a+c,0)),
                hoverOffset:4,
                backgroundColor: 'red',
            },
            {
                label:'Orders',
                data:labels.map(l=>orders.filter(q=>l == q.date).map(j=>j.price_total).reduce((a,c)=>a+c,0)),
                hoverOffset:4,
                backgroundColor: 'green',
            },
            ],
        },
        domain,
        label_field:'date',
        }
    }
    async getPartnerOrders()
    {
         let domain = [['state','in',['sale','done','draft','sent']]]
        if(this.state.period > 0)
        {
            domain.push(['date','>',this.state.current_date])
        }
        const data = await this.orm.readGroup('sale.report',domain,
        ['partner_id','price_total','product_uom_qty'],['partner_id'],
        {orderby:'partner_id',lazy:false})
        this.state.partnerOrders = {
        data: {
            labels:data.map(d=>d.partner_id[1]),
            datasets:[
            {
                label:'Total Amount',
                data:data.map(d=>d.price_total),
                hoverOffset:4,
                backgroundColor: 'orange',
                yAxisID:'Total',
                order:1,
            },
            {
                label:'Ordered Qty',
                data:data.map(d=>d.product_uom_qty),
                hoverOffset:4,
//                backgroundColor: 'blue',
                type:'line',
                borderColor:'blue',
                yAxisID:'Qty',
                order:0,
            },
            ],
        },
        scales:{
//            Qty:{
//                position:'right',
//            }
            yAxis:[{
                id:'Qty',position:'right'
            },
            {
                id:'Total',position:'left'
            },
            ]
        },
        domain,
        label_field:'partner_id',
        }
    }
    setup()
    {
        this.orm = useService("orm")
        this.action = useService('action')
        this.state= useState({
            quotations:{
            value:0,percentage:0,
            },
            orders:{
            value:0,percentage:0,revenue_total:0,revenue_percentage:0,average_percentage:0,average_total:0,
            },
            period:90,
//            date:false,
        })
        onWillStart(async ()=>{
        await loadJS('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js')
        await this.getDates()
        await this.getQuotations()
        await this.getOrders()
        await this.getTopProducts()
        await this.getTopSalesPeople()
        await this.getMonthlySales()
        await this.getPartnerOrders()
        })
    }
    async getQuotations()
    {   let domain = [['state','in',['draft','sent']]]
        if(this.state.period > 0)
        {
            domain.push(['date_order','>',this.state.current_date])
        }
        const data = await this.orm.searchCount('sale.order',domain)
        this.state.quotations.value = data
        let prev_domain = [['state','in',['draft','sent']]]
        if(this.state.period > 0)
        {
            prev_domain.push(['date_order','>',this.state.previous_date])
            prev_domain.push(['date_order','<=',this.state.current_date])
        }
        const prev_data = await this.orm.searchCount('sale.order',domain)
        const percentage = ((data - prev_data)/prev_data)*100
        this.state.quotations.percentage = percentage.toFixed(2)
        console.log(data,prev_data,percentage,domain,prev_domain)
        console.log(this.state.current_date,this.state.previous_date)
    }
    async getOrders()
    {
        let domain = [['state','in',['sale','done']]]
        if(this.state.period > 0)
        {
            domain.push(['date_order','>',this.state.current_date])
        }
        const data = await this.orm.searchCount('sale.order',domain)
        this.state.orders.value = data
        let prev_domain = [['state','in',['sale','done']]]
        if(this.state.period > 0)
        {
            prev_domain.push(['date_order','>',this.state.previous_date])
            prev_domain.push(['date_order','<=',this.state.current_date])
        }
        const prev_data = await this.orm.searchCount('sale.order',domain)
        const percentage = ((data - prev_data)/prev_data)*100
        this.state.orders.percentage = percentage.toFixed(2)
        console.log(data,prev_data,percentage,domain,prev_domain)
        console.log(this.state.current_date,this.state.previous_date)

        const current_revenue = await this.orm.readGroup('sale.order',domain,['amount_total:sum'],[])
        const prev_revenue = await this.orm.readGroup('sale.order',prev_domain,['amount_total:sum'],[])
        const revenue_percentage = ((current_revenue[0].amount_total - prev_revenue[0].amount_total)/prev_revenue[0].amount_total)*100
        const revenue_total =(current_revenue[0].amount_total/1000).toFixed(2)
        if (revenue_total >1000)
        {
            this.state.revenue_total = `${(revenue_total/1000).toFixed(2)}M`
        }
        else{
            this.state.revenue_total = `$${revenue_total}K`
        }

        this.state.revenue_percentage = revenue_percentage.toFixed(2)


        const current_average = await this.orm.readGroup('sale.order',domain,['amount_total:avg'],[])
        const prev_average = await this.orm.readGroup('sale.order',prev_domain,['amount_total:avg'],[])
        const avg_percentage = ((current_average[0].amount_total - prev_average[0].amount_total)/prev_average[0].amount_total)*100
        const average_total =(current_average[0].amount_total/1000).toFixed(2)
        if (average_total >1000)
        {
            this.state.average_total = `${(average_total/1000).toFixed(2)}M`
        }
        else{
            this.state.average_total = `$${average_total}K`
        }

        this.state.average_percentage = avg_percentage.toFixed(2)
    }
    async viewQuotations()
    {
        let domain = [['state','in',['draft','sent']]]
        if(this.state.period > 0)
        {
            domain.push(['date_order','>',this.state.current_date])
        }
        let listView = await this.orm.searchRead('ir.model.data',[['name','=','view_quotation_tree_with_onboarding']],['res_id'])
        this.action.doAction({
        type:'ir.actions.act_window',
        name:"Quotations",
        res_model:'sale.order',
        domain,
        views : [[listView.length>0?listView[0].res_id:false,'list'],[false,'form'],],
        })
    }
    viewOrders()
    {
        let domain = [['state','in',['sale','done']]]
        if(this.state.period > 0)
        {
            domain.push(['date_order','>',this.state.current_date])
        }
        this.action.doAction({
        type:'ir.actions.act_window',
        name:"Orders",
        res_model:'sale.order',
        domain,
        context:{group_by:['date_order']},
        views : [[false,'list'],[false,'form'],],
        })
    }
     viewRevenues()
    {
        let domain = [['state','in',['sale','done']]]
        if(this.state.period > 0)
        {
            domain.push(['date_order','>',this.state.current_date])
        }
        this.action.doAction({
        type:'ir.actions.act_window',
        name:"Orders",
        res_model:'sale.order',
        domain,
        context:{group_by:['date_order']},
        views : [[false,'pivot'],[false,'form'],],
        })
    }

    async onChangePeriod()
    {
         this.getDates()
        await this.getQuotations()
        await this.getOrders()
        await this.getTopProducts()
        await this.getTopSalesPeople()
        await this.getMonthlySales()
        await this.getPartnerOrders()
    }
    getDates()
   {
            this.state.current_date=moment().subtract(this.state.period, 'days').format('YYYY-MM-DD HH:mm:ss.SSSSS')
            this.state.previous_date=moment().subtract((this.state.period*2), 'days').format('YYYY-MM-DD HH:mm:ss.SSSSS')

   }

    }
OdooSalesDashboard.template="custom_dashboard.odooSalesDashboard";
OdooSalesDashboard.components = {KpiCard,ChartRenderer};
registry.category("actions").add('odooSalesDashboard',OdooSalesDashboard);