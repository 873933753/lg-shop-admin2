<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts'

import { onMounted, ref } from 'vue'

import { EchartsUI, useEcharts } from '@vben/plugins/echarts'

const trendRef = ref<EchartsUIType>()
const orderRef = ref<EchartsUIType>()
const categoryRef = ref<EchartsUIType>()

const { renderEcharts: renderTrendChart } = useEcharts(trendRef)
const { renderEcharts: renderOrderChart } = useEcharts(orderRef)
const { renderEcharts: renderCategoryChart } = useEcharts(categoryRef)

const trendOptions = {
  color: ['#0f766e', '#f97316'],
  grid: {
    bottom: 30,
    left: 35,
    right: 20,
    top: 36,
  },
  legend: {
    data: ['销售额', '订单量'],
    right: 12,
    top: 0,
  },
  tooltip: { trigger: 'axis' },
  xAxis: {
    axisLabel: { color: '#64748b' },
    axisLine: { lineStyle: { color: '#cbd5e1' } },
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    type: 'category',
  },
  yAxis: [
    {
      axisLabel: { color: '#64748b', formatter: '{value}k' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      type: 'value',
    },
    {
      axisLabel: { color: '#64748b' },
      splitLine: { show: false },
      type: 'value',
    },
  ],
  series: [
    {
      areaStyle: {
        color: 'rgba(15,118,110,0.16)',
      },
      data: [84, 96, 108, 118, 126, 154, 168],
      name: '销售额',
      smooth: true,
      type: 'line',
    },
    {
      data: [320, 366, 395, 418, 436, 502, 560],
      name: '订单量',
      smooth: true,
      type: 'line',
      yAxisIndex: 1,
    },
  ],
}

const orderOptions = {
  color: ['#14b8a6'],
  grid: {
    bottom: 20,
    left: 30,
    right: 10,
    top: 30,
  },
  tooltip: { trigger: 'axis' },
  xAxis: {
    axisLabel: { color: '#64748b' },
    axisLine: { lineStyle: { color: '#cbd5e1' } },
    data: ['0-3h', '3-6h', '6-9h', '9-12h', '12-15h', '15-18h', '18-21h', '21-24h'],
    type: 'category',
  },
  yAxis: {
    axisLabel: { color: '#64748b' },
    splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    type: 'value',
  },
  series: [
    {
      barMaxWidth: 24,
      data: [45, 82, 138, 196, 178, 154, 210, 126],
      name: '订单数',
      type: 'bar',
    },
  ],
}

const categoryOptions = {
  color: ['#14b8a6', '#f97316', '#facc15', '#6366f1', '#22c55e'],
  legend: {
    bottom: 0,
    icon: 'circle',
  },
  tooltip: { trigger: 'item' },
  series: [
    {
      center: ['50%', '44%'],
      data: [
        { name: '类目1', value: 38 },
        { name: '类目2', value: 26 },
        { name: '类目3', value: 18 },
        { name: '类目4', value: 12 },
        { name: '其他', value: 6 },
      ],
      radius: ['42%', '68%'],
      type: 'pie',
    },
  ],
}

onMounted(async () => {
  await Promise.all([
    renderTrendChart(trendOptions as never),
    renderOrderChart(orderOptions as never),
    renderCategoryChart(categoryOptions as never),
  ])
})
</script>

<template>
  <div class="min-h-full bg-slate-50 p-4 lg:p-6">
    <section class="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      <h1 class="text-2xl font-semibold text-slate-900 lg:text-3xl">
        <!-- 欢迎回来，{{ userStore.userInfo?.realName || userStore.userInfo?.username || '管理员' }} -->
        数据总览
      </h1>
      <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <article class="rounded-xl bg-violet-50 p-4">
          <p class="text-xs text-violet-700">今日销售额</p>
          <p class="mt-1 text-2xl font-semibold text-violet-900">¥168,420</p>
          <p class="mt-1 text-xs text-violet-700">较昨日 +12.4%</p>
        </article>
        <article class="rounded-xl bg-violet-50 p-4">
          <p class="text-xs text-violet-700">今日订单数</p>
          <p class="mt-1 text-2xl font-semibold text-violet-900">560</p>
          <p class="mt-1 text-xs text-violet-700">支付转化率 7.9%</p>
        </article>
        <article class="rounded-xl bg-violet-50 p-4">
          <p class="text-xs text-violet-700">待发货订单</p>
          <p class="mt-1 text-2xl font-semibold text-violet-900">142</p>
          <p class="mt-1 text-xs text-violet-700">平均发货时长 5.2h</p>
        </article>
        <article class="rounded-xl bg-violet-50 p-4">
          <p class="text-xs text-violet-700">新增用户</p>
          <p class="mt-1 text-2xl font-semibold text-violet-900">238</p>
          <p class="mt-1 text-xs text-violet-700">复购用户占比 28%</p>
        </article>
      </div>
    </section>

    <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 xl:col-span-2">
        <h2 class="text-base font-semibold text-slate-900">近 7 日销售趋势</h2>
        <p class="mt-1 text-xs text-slate-500">销售额与订单量走势</p>
        <EchartsUI ref="trendRef" class="mt-4" height="320px" />
      </article>

      <article class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 class="text-base font-semibold text-slate-900">商品类目占比</h2>
        <p class="mt-1 text-xs text-slate-500">当前订单来源结构</p>
        <EchartsUI ref="categoryRef" class="mt-4" height="320px" />
      </article>
    </section>

    <section class="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h2 class="text-base font-semibold text-slate-900">分时订单分布</h2>
      <p class="mt-1 text-xs text-slate-500">全天订单高峰主要集中在晚间时段</p>
      <EchartsUI ref="orderRef" class="mt-4" height="300px" />
    </section>
  </div>
</template>
