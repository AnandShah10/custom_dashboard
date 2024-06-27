/**@odoo-module**/

import { registry } from "@web/core/registry";
import { Component,onMounted,useRef,useState,onWillStart,useEffect,onWillUnmount } from "@odoo/owl";
import {loadJS} from "@web/core/assets";
import {useService} from "@web/core/utils/hooks";

export class ChartRenderer extends Component{
    setup()
    {
        console.log("hello")
        this.chartRef= useRef('chart')
        this.actionService = useService("action")
        onWillStart(async ()=>{
//            await loadJS('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js')
              await loadJS('/web/static/lib/Chart/Chart.js')
        })
        useEffect(()=>{
            this.renderChart()
        },()=>[this.props.config])
        onMounted(()=>this.renderChart())
        onWillUnmount(()=>{
            if(this.chart)
            {
                this.chart.destroy()
            }
        })
    }
    renderChart()
    {
        if(this.chart)
        {
            this.chart.destroy()
        }
        this.chart = new Chart(
                this.chartRef.el,
                {   type:this.props.type,
                     options: {
                        responsive:true,
                        onClick: (e)=>{
//                            console.log(e)
//                            const active = e.chart.getActiveElements()
//                            console.log(e.chart.data)
//                            console.log("Will it work?")
//                            if(active && active[0] && (active[0].index != undefined) && (active[0].datasetIndex != undefined))
//                            {
                                 const [activeElement] = this.chart.getElementsAtEventForMode(
                                        e,
                                        "nearest",
                                        { intersect: true },
                                        false
                                    );
                                    if (!activeElement) {
                                        return;
                                    }
                                    const { datasetIndex, index } = activeElement;
                               console.log("In condition")
                               const label = this.chart.data.labels[index]
                               const dataset = this.chart.data.datasets[datasetIndex].label
                               const { label_field ,domain} = this.props.config
                               let new_domain = domain ? domain:[]
                               if(label_field){
                                 if(label_field.includes('date'))
                                 {
                                       const timeStamp = Date.parse(label)
                                       const selected_month = moment(timeStamp)
                                       const monthStart = selected_month.format('YYYY-MM-DD HH:mm:ss.SSSSS')
                                       const monthEnd = selected_month.endOf('month').format('YYYY-MM-DD HH:mm:ss.SSSSS')
                                       new_domain.push(['date','>=',monthStart],['date','<=',monthEnd])
                                 }
                               else{ new_domain.push([label_field,'=',label])
                               }
                               }
                               console.log('dataset:',dataset)
                               if(dataset == 'Quotations')
                               {
                                    new_domain.push(['state','in',['draft','sent']])
                               }
                               if(dataset == 'Orders')
                               {
                                    new_domain.push(['state','in',['sale','done']])
                               }
                               console.log("Is there a problem here?",this.props.title,new_domain)
                               this.actionService.doAction({
                                      type:'ir.actions.act_window',
                                      name:this.props.title,
                                      res_model:'sale.report',
                                      domain:new_domain,
                                      views : [[false,'list'],[false,'form']],
                               })
//                            }
                        },
                        scales: 'scales' in this.props.config ? this.props.config.scales :{},
                        plugins: {
                          legend: {
                            position:'bottom',
                          },
                          title:{
                            display:true,
                            position:'bottom',
                            text:this.props.title,
                          }
                        }
                      },
                   data : this.props.config.data,

                }
              )
              console.log("Done chart")
    }

    }
ChartRenderer.template="custom_dashboard.chartRenderer";
