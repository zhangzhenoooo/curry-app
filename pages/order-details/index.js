const APP = getApp();
const WXAPI = require('apifm-wxapi')
APP.configLoadOK = () => {
  wx.setNavigationBarTitle({
    title: wx.getStorageSync('mallName')
  })
}
const wxbarcode = require('wxbarcode')
const wxpay = require('../../utils/pay.js')

Page({
    data:{
      
    },
    onLoad:function(e){
      // e.id = 601144
      this.setData({
        orderId: e.id
      })
      this.orderDetail()
    },
    onShow : function () {
      
    },
    async orderDetail() {
      const res = await WXAPI.orderDetail(wx.getStorageSync('token'), this.data.orderId)
      if (res.code != 0) {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
        return
      }
      // 绘制核销码
      if (res.data.orderInfo.hxNumber && res.data.orderInfo.status == 1) {
        wxbarcode.qrcode('qrcode', res.data.orderInfo.hxNumber, 400, 400);
      }        
      this.setData({
        orderDetail: res.data
      })
      if (res.data.orderInfo.shopIdZt) {
        this.shopSubdetail()
      }
    },
    async shopSubdetail() {
      const res = await WXAPI.shopSubdetail(this.data.orderDetail.orderInfo.shopIdZt)
      if (res.code == 0) {
        this.setData({
          shopSubdetail: res.data
        })
      }
    },
    async goPayOrder() {
        const _this = this
        let res = 0 ;
         const nextAction = {
          type: 9,
          orderId: this.data.orderDetail.orderInfo.id
        }
        const postData = {
          money: this.data.orderDetail.orderInfo.amountReal*1,
          remark: "堂食买单",
          nextAction: JSON.stringify(nextAction)
        }
        res = await WXAPI.wxpay(postData)
        if (res.code != 0) {
          wx.showModal({
            title: '出错了',
            content: JSON.stringify(res),
            showCancel: false
          })
      
        }
          wx.showToast({
            title: '买单成功'
          })
          _this.setData({
            paySuccess: true
          })
          wx.redirectTo({
            url: '/pages/all-orders/index',
          })
      },
    callshop() {
      wx.makePhoneCall({
        phoneNumber: this.data.shopSubdetail.info.linkPhone,
      })
    },
    wuliuDetailsTap:function(e){
      var orderId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: "/pages/wuliu/index?id=" + orderId
      })
    },
    confirmBtnTap:function(e){
      let that = this;
      let orderId = this.data.orderId;
      wx.showModal({
          title: '确认您已收到商品？',
          content: '',
          success: function(res) {
            if (res.confirm) {
              WXAPI.orderDelivery(wx.getStorageSync('token'), orderId).then(function (res) {
                if (res.code == 0) {
                  that.onShow();                  
                }
              })
            }
          }
      })
    },
    submitReputation: function (e) {
      let that = this;
      let postJsonString = {};
      postJsonString.token = wx.getStorageSync('token');
      postJsonString.orderId = this.data.orderId;
      let reputations = [];
      let i = 0;
      while (e.detail.value["orderGoodsId" + i]) {
        let orderGoodsId = e.detail.value["orderGoodsId" + i];
        let goodReputation = e.detail.value["goodReputation" + i];
        let goodReputationRemark = e.detail.value["goodReputationRemark" + i];

        let reputations_json = {};
        reputations_json.id = orderGoodsId;
        reputations_json.reputation = goodReputation;
        reputations_json.remark = goodReputationRemark;

        reputations.push(reputations_json);
        i++;
      }
      postJsonString.reputations = reputations;
      WXAPI.orderReputation({
        postJsonString: JSON.stringify(postJsonString)
      }).then(function (res) {
        if (res.code == 0) {
          that.onShow();
        }
      })
    }
})